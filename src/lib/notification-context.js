 'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { auth } from './firebase';
import { useAuth } from './auth-context';
import { useRefresh, refreshScope } from './refresh';
import { defaultPreferences } from './notification-policy';
import { usePhonePush } from './phone-push';
const Context = createContext(null);
const empty = { notifications: [], unreadCount: 0, urgentCount: 0, badgeCount: 0, recipients: [], publisherChannels: [], preferences: defaultPreferences, nextOffset: null };
export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const uid = !authLoading && !user?.isPartnerSession && (user?.emailVerified || user?.phoneNumber || user?.isFamilyMember) ? user.uid : null;
  const [state, setState] = useState({ uid: null, data: empty, error: '' });
  const [view, setView] = useState({ kind: 'all', unread: false });
  const [loading, setLoading] = useState(false);
  const lastAccount = useRef(null);
  const lastView = useRef(null);
  const loadedPages = useRef(1);
  const push = usePhonePush(authLoading ? undefined : uid);
  const refreshKey = `notifications:${uid}:${view.kind}:${view.unread}`;
  const request = useCallback(async (method = 'GET', body, publish = false, offset = 0, settings = false) => {
    const account = auth.currentUser;
    if (!uid || account?.uid !== uid) throw new Error('Please sign in to access notifications.');
    const token = await account.getIdToken();
    const query = new URLSearchParams({ kind: view.kind, unread: String(view.unread), offset: String(offset) });
    const response = await fetch(settings ? '/api/notifications/settings' : publish ? '/api/notifications/publish' : `/api/notifications?${query}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Notifications are unavailable.'), { status: response.status });
    if (auth.currentUser?.uid !== uid) throw new Error('Your account has changed. Please reload.');
    return data;
  }, [uid, view]);
  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const key = `${uid}:${view.kind}:${view.unread}`;
      const pageCount = lastAccount.current === uid && lastView.current === key ? loadedPages.current : 1;
      const pages = await Promise.all(Array.from({ length: pageCount }, (_, index) => request('GET', null, false, index * 50)));
      const data = { ...pages[0], nextOffset: pages.at(-1).nextOffset, notifications: [...new Map(pages.flatMap(page => page.notifications).map(item => [item.id, item])).values()] };
      lastAccount.current = uid; lastView.current = key; loadedPages.current = pageCount;
      setState({ uid, viewKey: key, data, error: '' });
    }
    catch (error) {
      setState(previous => ({ uid, data: previous.uid === uid && ![401, 403].includes(error.status) ? previous.data : empty, error: error.message }));
      throw error;
    } finally { setLoading(false); }
  }, [uid, request, view]);
  useRefresh(refreshKey, refresh);
  useEffect(() => {
    if (!uid) return;
    const onVisible = () => { if (!document.hidden) refreshScope(refreshKey).catch(() => {}); };
    const onPush = event => { if (event.data?.type === 'NOTIFICATION_RECEIVED') onVisible(); };
    onVisible();
    const timer = setInterval(onVisible, 30000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    navigator.serviceWorker?.addEventListener('message', onPush);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', onVisible); navigator.serviceWorker?.removeEventListener('message', onPush); };
  }, [uid, refresh, refreshKey]);
  const current = state.uid === uid && (!state.viewKey || state.viewKey === `${uid}:${view.kind}:${view.unread}`) ? state : { data: empty, error: '' };
  useEffect(() => {
    if (!uid || !push.enabled) { navigator.clearAppBadge?.().catch(() => {}); return; }
    const count = current.data.badgeCount;
    if (count) navigator.setAppBadge?.(count).catch(() => {});
    else navigator.clearAppBadge?.().catch(() => {});
  }, [uid, push.enabled, current.data.badgeCount]);
  async function markRead(ids, acknowledge = false) { await request('PATCH', { ids, acknowledge }); await refresh(); }
  async function send(message, publish) { await request('POST', message, publish); await refresh(); }
  async function savePreferences(preferences) { await request('POST', { preferences }, false, 0, true); await refresh(); }
  async function loadMore() {
    if (loading || current.data.nextOffset == null) return;
    setLoading(true);
    try {
      const data = await request('GET', null, false, current.data.nextOffset);
      loadedPages.current += 1;
      setState(previous => ({ uid, viewKey: `${uid}:${view.kind}:${view.unread}`, error: '', data: { ...data, notifications: [...new Map([...previous.data.notifications, ...data.notifications].map(item => [item.id, item])).values()] } }));
    } finally { setLoading(false); }
  }
  return <Context.Provider value={{ ...current.data, error: current.error, loading, ready: !!uid && state.uid === uid, available: !!uid, refresh, markRead, send, savePreferences, push, view, setView, loadMore }}>{children}</Context.Provider>;
}
export function useNotifications() { return useContext(Context); }
