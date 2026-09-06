import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/cream/companies
 * CREAM Master Route: List all security companies and their operational status.
 */
export async function GET() {
  try {
    const firestore = getAdminFirestore();
    const snap = await firestore.collection('security_companies').get();

    let companies = [];
    if (snap.empty) {
      // Seed default companies if collection is currently blank
      companies = [
        {
          id: 'help24_security',
          name: 'Help24 Security Command',
          registrationNumber: 'PSIRA-2024/99182',
          dispatchPhone: '+27 11 123 4567',
          contactEmail: 'controlroom@help24.co.za',
          status: 'active',
          memberCount: 142,
          deviceCount: 38,
          aura: { enabled: true, environment: 'staging' },
        },
        {
          id: 'global_security',
          name: 'Global Security Consulting',
          registrationNumber: 'PSIRA-2023/55410',
          dispatchPhone: '+27 10 999 8888',
          contactEmail: 'ops@globalsecurity.co.za',
          status: 'active',
          memberCount: 89,
          deviceCount: 19,
          aura: { enabled: true, environment: 'staging' },
        },
        {
          id: 'fidelity_adt',
          name: 'Fidelity ADT Dispatch',
          registrationNumber: 'PSIRA-1998/00124',
          dispatchPhone: '+27 86 121 2100',
          contactEmail: 'dispatch@fidelity-adt.co.za',
          status: 'active',
          memberCount: 512,
          deviceCount: 120,
          aura: { enabled: false, environment: 'staging' },
        },
      ];

      for (const comp of companies) {
        await firestore.collection('security_companies').doc(comp.id).set({
          ...comp,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      companies = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
      }));
    }

    return NextResponse.json({ companies });
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
        cameras: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await firestore.collection('security_companies').doc(id).set(companyData);
      return NextResponse.json({ success: true, company: companyData });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[api/cream/companies] POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
