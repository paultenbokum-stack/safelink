import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';

import { isManagementAdmin } from '@/lib/management-auth';

export const INCIDENT_TYPES = [
  { id: 'armed_robbery', label: 'Armed Robbery', icon: 'dangerous', color: '#e53e3e' },
  { id: 'break_in', label: 'Break-in / Burglary', icon: 'door_front', color: '#dd6b20' },
  { id: 'medical', label: 'Medical Emergency', icon: 'local_hospital', color: '#3182ce' },
  { id: 'fire', label: 'Fire', icon: 'local_fire_department', color: '#e53e3e' },
  { id: 'vehicle_theft', label: 'Vehicle Theft / Hijacking', icon: 'directions_car', color: '#805ad5' },
  { id: 'panic', label: 'Panic / Duress', icon: 'emergency', color: '#d69e2e' },
  { id: 'false_alarm', label: 'False Alarm', icon: 'cancel', color: '#718096' },
  { id: 'other', label: 'Other', icon: 'report', color: '#a0aec0' },
];

/**
 * GET /api/cream/company/[companyId]/incidents
 * List all incidents for a specific security company's customers.
 */
export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

    const companyDoc = await db.collection('security_companies').doc(companyId).get();
    if (!companyDoc.exists) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    let q = db.collection('incidents').where('securityCompanyId', '==', companyId);
    const snap = await q.orderBy('createdAt', 'desc').limit(500).get();

    let incidents = snap.docs.map(doc => {
      const data = doc.data();
      const created = data.createdAt?.toDate?.() || (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : new Date(data.createdAt));
      return {
        id: doc.id,
        type: data.incidentType || data.type || 'other',
        status: data.status || 'unknown',
        customerUid: data.uid || '',
        customerName: data.customerName || '',
        location: data.location || null,
        responseTime: data.responseTime || null,
        createdAt: created.toISOString(),
        resolvedAt: data.resolvedAt || null,
      };
    });

    if (type) incidents = incidents.filter(i => i.type === type);
    if (status) incidents = incidents.filter(i => i.status === status);

    // Summary by type
    const byType = {};
    for (const t of INCIDENT_TYPES) byType[t.id] = { ...t, count: 0 };
    for (const i of incidents) {
      if (byType[i.type]) byType[i.type].count++;
      else if (byType.other) byType.other.count++;
    }

    return NextResponse.json({
      incidents,
      summary: { total: incidents.length, byType: Object.values(byType), types: INCIDENT_TYPES },
      company: { id: companyId, name: companyDoc.data().name },
    });
  } catch (err) {
    console.error(`[api/cream/company/incidents] Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load incidents.' }, { status: 500 });
  }
}
