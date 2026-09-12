import { drainPushQueue } from './notification-push';
import { NextResponse, after } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { notificationService } from '@/lib/notifications';

export async function handleNotificationRequest(request, action) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const service = notificationService({ firestore: getAdminFirestore() });
    let body = {};
    if (request.method !== 'GET') {
      const raw = await request.text();
      if (raw.length > 25000) return NextResponse.json({ error: 'Message is too large.' }, { status: 413 });
      body = JSON.parse(raw);
    }
    const search = new URL(request.url).searchParams;
    const result = action === 'list' ? await service.list(user, { offset: search.get('offset'), kind: search.get('kind'), unread: search.get('unread') === 'true' }) : action === 'read' ? await service.markRead(user, body.ids, body.acknowledge === true) : await service.send(user, body, action === 'publish');
    if (action !== 'list') after(() => drainPushQueue().catch(() => console.warn('[push] Delivery deferred to queue worker.')));
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.status ? error.message : error.message === 'UNAUTHENTICATED' ? 'Please sign in again to access notifications.' : 'Notifications are unavailable. Please retry.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : error instanceof SyntaxError ? 400 : error.status || 503 });
  }
}
