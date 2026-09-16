import { managementAccessError } from '@/lib/management-auth';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { DEMO_COMPANIES } from '@/lib/demo-companies';
import { FieldValue } from 'firebase-admin/firestore';
import { saveCompanyBranding } from '@/lib/branding-store';

/**
 * GET /api/cream/companies
 * CREAM Master Route: List all security companies and their operational status.
 */
export async function GET(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const firestore = getAdminFirestore();
    const snap = await firestore.collection('security_companies').get();

    // Never seed demo tenants during a GET request. Expose only presentation fields.
    const companies = snap.empty ? DEMO_COMPANIES : snap.docs.map(doc => {
      const c = doc.data();
      const legacyDemo = ['PSIRA-2024/99182', 'PSIRA-2023/55410', 'PSIRA-1998/00124'].includes(c.registrationNumber);
      return { id: doc.id, name: c.name, isDemo: c.isDemo === true || legacyDemo, status: c.status,
        memberCount: c.memberCount || 0, deviceCount: c.deviceCount || 0,
        accounting: { provider: c.accounting?.provider }, cameraSystem: { defaultBrand: c.cameraSystem?.defaultBrand },
        aura: { enabled: c.aura?.enabled === true }, cameras: (c.cameras || []).map(() => ({})) };
    });
    return NextResponse.json({ companies: companies.every(c => c.isDemo) ? DEMO_COMPANIES : companies.filter(c => !c.isDemo) });
  } catch (err) {
    console.error('[api/cream/companies] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/cream/companies
 * CREAM Master Route: Onboard new security company or toggle status (active / suspended).
 */
export async function POST(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const body = await request.json();
    const { action, companyId, status, newCompany } = body;
    const firestore = getAdminFirestore();

    if (action === 'toggle_status') {
      await firestore.collection('security_companies').doc(companyId).update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: `Company status updated to ${status}` });
    }

    if (action === 'create_company') {
      const id = (newCompany.slug || newCompany.name || `comp_${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');

      const companyData = {
        id,
        name: newCompany.name,
        registrationNumber: newCompany.registrationNumber || '',
        dispatchPhone: newCompany.dispatchPhone || '',
        contactEmail: newCompany.contactEmail || '',
        status: 'active',
        memberCount: 0,
        deviceCount: 0,
        aura: {
          enabled: true,
          environment: 'staging',
          clientId: '',
          clientSecret: '',
        },
        accounting: {
          provider: newCompany.accountingProvider || 'sage',
          environment: 'production',
          apiKey: newCompany.accountingApiKey || '',
          companyId: newCompany.accountingCompanyId || '',
          autoSyncClients: true,
          status: newCompany.accountingApiKey ? 'connected' : 'configured',
          lastSync: new Date().toISOString(),
        },
        cameraSystem: {
          defaultBrand: newCompany.cameraBrand || 'Hikvision',
          cloudApiKey: newCompany.cameraApiKey || '',
          cloudAccount: '',
          gatewayUrl: 'rtsp-gateway.safelink.co.za:8554',
          status: 'connected',
        },
        cameras: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (newCompany.branding) {
        companyData.branding = newCompany.branding;
        await saveCompanyBranding(id, newCompany.branding);
      }

      await firestore.collection('security_companies').doc(id).set(companyData);
      return NextResponse.json({ success: true, company: companyData });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[api/cream/companies] POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
