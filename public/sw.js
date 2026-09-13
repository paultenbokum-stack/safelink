/* Cache public static assets only; never account pages, API or RSC data. */
const CACHE_NAME = 'safelink-static-v7';
const ASSETS = ['/offline.html', '/icons/shield-192.png', '/icons/shield-512.png', '/safelink-shield.png', '/favicon.ico'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
function accountBinding(value, write = false) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('safelink-push-account', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('state', write ? 'readwrite' : 'readonly');
      const result = write ? tx.objectStore('state').put(value, 'uid') : tx.objectStore('state').get('uid');
      tx.oncomplete = () => { db.close(); resolve(result.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'PUSH_ACCOUNT') event.waitUntil(accountBinding(event.data.uid || null, true).then(async () => { if (!event.data.uid) { (await self.registration.getNotifications()).forEach(notification => notification.close()); await self.navigator.clearAppBadge?.(); } }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('safelink-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.has('RSC') || url.searchParams.has('_rsc')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || new Response('Offline', { status: 503 })));
    return;
  }
  if (!url.pathname.startsWith('/_next/static/') && !ASSETS.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); const keys = await cache.keys(); if (keys.length > 200) await Promise.all(keys.filter(key => !ASSETS.includes(new URL(key.url).pathname)).slice(0, keys.length - 200).map(key => cache.delete(key))); }
    return response;
  })());
});
// Firebase data messages use this worker, avoiding a competing root worker.
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    const data = payload?.data;
    if (!data?.eventId || !data.uid || await accountBinding() !== data.uid) return;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach(client => client.postMessage({ type: 'NOTIFICATION_RECEIVED' }));
    await self.registration.showNotification(data.title || 'SafeLink', {
      body: data.body || 'You have a new SafeLink notification.', icon: '/icons/shield-192.png', badge: '/icons/shield-192.png',
      tag: data.groupId || data.eventId, renotify: data.priority === 'urgent',
      data: { url: '/notifications', eventId: data.eventId },
    });
    if (data.badge === 'true' && self.navigator.setAppBadge) await self.navigator.setAppBadge().catch(() => {});
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate('/notifications'); return existing.focus(); }
    return self.clients.openWindow('/notifications');
  })());
});
