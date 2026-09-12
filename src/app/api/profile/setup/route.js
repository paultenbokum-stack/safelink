import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Newly registered users may save their own profile before verifying email.
// This exception does not grant access to devices, events, payments or other accounts.
export async function POST(request) {
  try {
    const user = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const raw = await request.text();
    if (raw.length > 12000) return NextResponse.json({ error: 'Profile is too large' }, { status: 413 });
    const data = JSON.parse(raw);
    const text = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const phone = text(data.phone).replace(/\D/g, '');
    if (!/^27[6-8]\d{8}$/.test(phone) || !text(data.adminFirstName) || !text(data.adminLastName)) {
      return NextResponse.json({ error: 'Enter a valid South African cell number and your name.' }, { status: 400 });
    }
    const record = {
      uid: user.uid, adminFirstName: text(data.adminFirstName), adminLastName: text(data.adminLastName),
      householdName: text(data.householdName), circleRole: text(data.circleRole),
      phone: `+${phone}`, phoneVerified: false, email: user.email || '',
      memberCount: Math.min(30, Math.max(1, Number.parseInt(data.memberCount) || 1)),
      address: Object.fromEntries(['line1','suburb','city','province','postalCode'].map(key => [key, text(data.address?.[key])])),
      emergency: Object.fromEntries(['name','phone','relation'].map(key => [key, text(data.emergency?.[key])])),
      medicalNotes: text(data.medicalNotes, 1000), onboardingCompleted: true, updatedAt: FieldValue.serverTimestamp(),
    };
    await getAdminFirestore().collection('households').doc(user.uid).set(record, { merge: true });
    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json({ error: 'Could not save your profile. Please retry.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 503 });
  }
}

export async function GET(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const snap = await getAdminFirestore().collection('households').doc(user.uid).get();
    const data = snap.data();
    // Explicitly select consumer profile fields; never expose partner credentials.
    const fields = ['members','avatarUrl','adminFirstName','adminLastName','householdName','circleRole','phone','phoneVerified','email','memberCount','address','emergency','medicalNotes','onboardingCompleted'];
    return NextResponse.json({ household: snap.exists ? { id: user.uid, ...Object.fromEntries(fields.filter(k => data[k] !== undefined).map(k => [k,data[k]])) } : null }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Profile unavailable' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 503 });
  }
}
