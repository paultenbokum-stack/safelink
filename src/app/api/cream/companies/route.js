import { managementAccessError } from '@/lib/management-auth';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { DEMO_COMPANIES, isDummyCompany } from '@/lib/demo-companies';
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

    const companyMap = new Map();
    DEMO_COMPANIES.forEach(c => {
      if (!isDummyCompany(c)) companyMap.set(c.id, { ...c });
    });

    snap.docs.forEach(doc => {
      const c = doc.data();
      if (isDummyCompany({ id: doc.id, ...c })) {
        // Asynchronously purge dummy doc from Firestore
        doc.ref.delete().catch(() => {});
        return;
      }
      const existing = companyMap.get(doc.id);
      const isArchived = c.isArchived === true || c.status === 'archived' || existing?.isArchived === true;
      companyMap.set(doc.id, {
        ...(existing || {}),
        id: doc.id,
        name: c.name || existing?.name,
        isDemo: false,
        status: isArchived ? 'archived' : (c.status || existing?.status || 'active'),
        isArchived,
        memberCount: c.memberCount || existing?.memberCount || 0,
        deviceCount: c.deviceCount || existing?.deviceCount || 0,
        registrationNumber: c.registrationNumber || existing?.registrationNumber || '',
        psiraNumber: c.psiraNumber || existing?.psiraNumber || '',
        accounting: { provider: c.accounting?.provider || existing?.accounting?.provider },
        cameraSystem: { defaultBrand: c.cameraSystem?.defaultBrand || existing?.cameraSystem?.defaultBrand },
        aura: { enabled: c.aura?.enabled === true || existing?.aura?.enabled === true },
        cameras: (c.cameras || []).map(() => ({})),
      });
    });

    const companies = Array.from(companyMap.values()).filter(c => !isDummyCompany(c));
    return NextResponse.json({ companies });
  } catch (err) {
    console.error('[api/cream/companies] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/cream/companies
 * CREAM Master Route: Onboard new security company, toggle status, or archive/unarchive.
 */
export async function POST(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const body = await request.json();
    const { action, companyId, status, isArchived: explicitIsArchived, newCompany } = body;
    const firestore = getAdminFirestore();

    if (action === 'toggle_status' || action === 'archive_company' || action === 'unarchive_company') {
      const nextStatus = action === 'archive_company' ? 'archived' : (action === 'unarchive_company' ? 'active' : (status || 'active'));
      const isArchived = action === 'archive_company' || explicitIsArchived === true || nextStatus === 'archived';
      await firestore.collection('security_companies').doc(companyId).set({
        status: nextStatus,
        isArchived,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return NextResponse.json({ success: true, message: `Company status updated to ${nextStatus}`, status: nextStatus, isArchived });
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
