import { managementAccessError } from '@/lib/management-auth';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const firestore = getAdminFirestore();

    if (!companyId) return NextResponse.json({ error: 'Company is required.' }, { status: 400 });
    const query = firestore.collection('incidents').where('companyId', '==', companyId).orderBy('createdAt', 'desc').limit(25);
    const snap = await query.get();

    const incidents = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      incidents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      });
    }

    return NextResponse.json({ incidents });
  } catch (err) {
    console.error('[api/control-room/incidents] GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const body = await request.json();
    const { incidentId, status, notes } = body;

    if (!incidentId || !status) {
      return NextResponse.json({ error: 'Missing incidentId or status' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const incidentRef = firestore.collection('incidents').doc(incidentId);

    const updates = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (notes) updates.controlRoomNotes = notes;
    if (status === 'resolved') updates.resolvedAt = FieldValue.serverTimestamp();

    await incidentRef.update(updates);

    return NextResponse.json({ success: true, message: `Incident ${incidentId} marked as ${status}` });
  } catch (err) {
    console.error('[api/control-room/incidents] POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
