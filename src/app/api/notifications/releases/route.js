import { createHash } from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { drainPushQueue } from '@/lib/notification-push';
export async function POST(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (user.notificationAdmin !== true) return NextResponse.json({ error: 'Release publisher access required.' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 5000) throw new Error('Invalid release');
    const { version, title, body, important = false } = JSON.parse(raw);
    if (typeof version !== 'string' || !/^[\w.-]{1,128}$/.test(version) || typeof title !== 'string' || !title.trim() || title.length > 100 || typeof body !== 'string' || !body.trim() || body.length > 1000) throw new Error('Invalid release');
    const db = getAdminFirestore();
    const id = createHash('sha256').update(version).digest('hex');
    const ref = db.collection('notificationReleases').doc(id);
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      tx.set(ref, { version, title: title.trim(), body: body.trim(), priority: important ? 'important' : 'routine', groupId: `release:${version}`, createdAt: Date.now() });
      // Routine deployment fixes do not create phone pushes, even for update subscribers.
      if (important) tx.set(db.collection('notificationPushJobs').doc(id), { audience: 'release', eventId: `release:${id}`, nextAttemptAt: Date.now(), createdAt: Date.now(), expiresAt: Date.now() + 172800000 });
    });
    after(() => drainPushQueue());
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: error.message === 'UNAUTHENTICATED' ? 'Sign in required' : 'Release could not be published.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 400 }); }
}
