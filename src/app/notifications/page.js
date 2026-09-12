'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';
import NotificationSettings from '@/app/components/NotificationSettings';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-context';

const categories = [['all', 'All'], ['alerts', 'Alerts'], ['updates', 'App Updates'], ['family', 'Family'], ['community', 'Community'], ['security', 'Security']];
const icons = { alerts: 'emergency', updates: 'system_update', family: 'family_restroom', community: 'groups', security: 'shield' };
export default function NotificationsPage() { const { user } = useAuth(); return <AuthGuard><NotificationCenter key={user?.uid} /></AuthGuard>; }
function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, recipients, publisherChannels, loading, ready, available, error, refresh, markRead, send, nextOffset, loadMore, view, setView } = useNotifications();
  const filter = view.kind;
  const setFilter = kind => setView({ ...view, kind });
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [priority, setPriority] = useState('routine');
  const [compose, setCompose] = useState(false);
  const [destination, setDestination] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const pending = useRef(null);
  const groups = new Map();
  for (const item of notifications) { const key = item.priority === 'urgent' ? item.id : item.groupId; const group = groups.get(key) || []; group.push(item); groups.set(key, group); }
  const visible = [...groups.values()].flatMap(group => expanded[group[0].groupId] ? group : [group[0]]).sort((a, b) => (b.priority === 'urgent') - (a.priority === 'urgent') || b.createdAt - a.createdAt);
  useEffect(() => {
    const timer = setTimeout(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(`safelink_message_draft:${user?.uid}`) || 'null'); if (saved) { setTitle(saved.title || ''); setBody(saved.body || ''); setDestination(saved.destination || 'all'); setCompose(true); } } catch {}
    setDraftLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [user?.uid]);
  useEffect(() => {
    if (!draftLoaded) return;
    try { const key = `safelink_message_draft:${user?.uid}`; if (title || body) sessionStorage.setItem(key, JSON.stringify({ title, body, destination })); else sessionStorage.removeItem(key); } catch {}
  }, [user?.uid, title, body, destination, draftLoaded]);
  const unread = visible.filter(item => !item.read).map(item => item.id);
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setNotice(''); setActionError('');
    const publish = destination.startsWith('channel:');
    const content = { title, body, priority: destination.startsWith('channel:') ? priority : 'routine', ...(publish ? { channelId: destination.slice(8) } : { recipientUid: destination }) };
    const fingerprint = JSON.stringify(content);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, requestId: crypto.randomUUID() };
    try {
      await send({ ...content, requestId: pending.current.requestId }, publish);
      pending.current = null; setTitle(''); setBody(''); setCompose(false);
      setNotice(publish ? 'Update published to the channel.' : 'Message sent to the family inbox.');
    } catch (error) { setActionError(error.message); }
    finally { setBusy(false); }
  }
  async function read(ids, acknowledge = false) {
    setBusy(true); setActionError('');
    try { await markRead(ids, acknowledge); } catch (error) { setActionError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background text-on-surface pb-28">
    <Header title="Notifications" showBack />
    <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-on-surface-variant">Your family’s SafeLink inbox</p>
        <button disabled={!ready || (!recipients.length && !publisherChannels.length)} onClick={() => { setCompose(value => !value); if (!recipients.length && publisherChannels.length) setDestination(`channel:${publisherChannels[0].id}`); setActionError(''); }} aria-expanded={compose} aria-controls="notification-compose" className="bg-secondary text-on-secondary font-bold rounded-xl px-4 min-h-11 disabled:opacity-50">{compose ? 'Close message' : 'New message'}</button>
      </div>
      {ready && <NotificationSettings />}
      {!available && <p role="status" className="text-sm">Notifications require a verified SafeLink account or a family invitation. Partner-only sessions are not connected to this inbox yet.</p>}
      {error && <div role="alert" className="glass-panel rounded-xl p-3 text-sm text-error">{error} <button onClick={() => refresh().catch(() => {})} className="underline ml-2">Retry</button></div>}
      {actionError && <p role="alert" className="text-sm text-error">{actionError}</p>}
      {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
      {compose && <form data-update-blocked={busy || !!title || !!body} id="notification-compose" onSubmit={submit} className="glass-panel p-4 rounded-2xl space-y-3">
        <label className="block text-sm font-semibold">To<select value={destination} onChange={event => setDestination(event.target.value)} className="block mt-1 w-full bg-surface border border-white/15 rounded-xl p-3">
          <option value="all" disabled={!recipients.length}>Everyone in my family</option>
          {recipients.map(person => <option key={person.uid} value={person.uid}>{person.name}</option>)}
          {publisherChannels.map(channel => <option key={channel.id} value={`channel:${channel.id}`}>{channel.name} — publish {channel.kind} update</option>)}
        </select></label>
        {destination.startsWith('channel:') && <label className="block text-sm font-semibold">Priority<select className="block mt-1 w-full bg-surface rounded-xl p-3" value={priority} onChange={event => setPriority(event.target.value)}><option value="routine">Routine</option><option value="important">Important</option>{publisherChannels.find(channel => `channel:${channel.id}` === destination)?.canSendUrgent && <option value="urgent">Urgent safety alert</option>}</select></label>}
        <label className="block text-sm font-semibold">Title<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} className="block mt-1 w-full bg-surface border border-white/15 rounded-xl p-3" placeholder="e.g. Home safely" /></label>
        <label className="block text-sm font-semibold">Message<textarea required maxLength={1000} rows={4} value={body} onChange={event => setBody(event.target.value)} className="block mt-1 w-full bg-surface border border-white/15 rounded-xl p-3" placeholder="Write your update…" /></label>
        <p className="text-xs text-on-surface-variant">{destination.startsWith('channel:') ? 'This update will be visible to every family subscribed to this channel.' : 'Only the selected family members can read this message. Members need to join SafeLink before you can message them.'}</p>
        <button disabled={busy || !title.trim() || !body.trim()} className="w-full rounded-xl min-h-11 bg-secondary text-on-secondary font-bold disabled:opacity-50">{busy ? 'Sending…' : destination.startsWith('channel:') ? 'Publish update' : 'Send message'}</button>
      </form>}
      <div role="group" aria-label="Filter notifications" className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 px-4 rounded-xl text-sm shrink-0 border ${filter === value ? 'bg-secondary/15 border-secondary text-secondary' : 'border-white/15 text-on-surface-variant'}`}>{label}</button>)}
      </div>
      <label className="flex gap-2 items-center min-h-11 text-sm"><input type="checkbox" checked={view.unread} onChange={event => setView({ ...view, unread: event.target.checked })} />Unread only</label>
      <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
        <span>Newest messages first · related updates grouped</span>
        <button disabled={busy || !unread.length} onClick={() => read(unread)} className="min-h-11 shrink-0 text-secondary underline disabled:opacity-40">Mark shown as read</button>
      </div>
      {loading && !ready && <p role="status" className="text-sm">Loading notifications…</p>}
      {ready && !error && !visible.length && <section className="glass-panel rounded-2xl p-6 text-center space-y-2">
        <span className="material-symbols-outlined text-3xl text-secondary" aria-hidden="true">notifications_none</span>
        <h2 className="font-bold">No {filter === 'all' ? '' : `${filter} `}notifications yet</h2>
        <p className="text-sm text-on-surface-variant">{['security', 'community'].includes(filter) ? 'Updates will appear when an authorised publisher posts to a channel connected to your family.' : 'Family messages and updates will appear here.'}</p>
        {!user?.isFamilyMember && !recipients.length && <Link href="/profile/family" className="inline-block pt-2 text-sm text-secondary underline">Invite family members</Link>}
      </section>}
      <div className="space-y-3">{visible.map(item => <article key={item.id} className={`rounded-2xl border p-4 space-y-2 ${item.read ? 'glass-panel border-white/10' : 'bg-secondary/5 border-secondary/40'}`}>
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary" aria-hidden="true">{icons[item.kind]}</span>
          <div className="min-w-0 flex-1"><p className="text-xs text-on-surface-variant break-words">{categories.find(([kind]) => kind === item.kind)?.[1] || 'SafeLink'} · {item.sent ? `You → ${item.recipientLabel}` : item.senderName}</p><h2 className="font-bold break-words">{item.title}</h2><p className={`text-xs font-semibold ${item.priority === 'urgent' ? 'text-error' : item.priority === 'important' ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{item.priority === 'urgent' ? '🔴 Urgent' : item.priority === 'important' ? '🟠 Important' : '🟢 Routine'}</p></div>
          {!item.read && <span className="text-[10px] text-secondary font-bold">Unread</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{item.body}</p>
        {item.priority === 'urgent' && !item.acknowledged && <button disabled={busy} className="min-h-11 rounded-xl px-3 bg-error text-white text-sm font-semibold" onClick={() => read([item.id], true)}>Acknowledge alert</button>}
        {item.priority === 'urgent' && item.acknowledged && <p className="text-xs">Acknowledged · this does not cancel a response</p>}
        {(groups.get(item.groupId)?.length || 0) > 1 && groups.get(item.groupId)[0].id === item.id && <button className="min-h-11 text-secondary text-xs underline" onClick={() => setExpanded({ ...expanded, [item.groupId]: !expanded[item.groupId] })}>{expanded[item.groupId] ? 'Collapse group' : `Show ${groups.get(item.groupId).length - 1} earlier messages in this group`}</button>}
        <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant"><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleString()}</time>{!item.read && <button disabled={busy} onClick={() => read([item.id])} className="min-h-11 text-secondary underline">Mark as read</button>}</div>
      </article>)}</div>
      {nextOffset !== null && <button disabled={loading} className="min-h-11 w-full text-secondary underline" onClick={() => loadMore().catch(error => setActionError(error.message))}>Load older messages</button>}
      <p className="text-xs text-on-surface-variant">Ordinary messages are not monitored for emergencies. Use SOS for help. Phone delivery depends on your connection and notification permissions.</p>
      {user?.isFamilyMember && <Link href="/family" className="block text-center text-secondary underline py-3">Back to my family</Link>}
    </main>
    {!user?.isFamilyMember && <BottomNav />}
  </div>;
}
