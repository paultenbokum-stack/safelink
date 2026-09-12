'use client';
import { useState } from 'react';
import { useNotifications } from '@/lib/notification-context';
import { notificationCategories } from '@/lib/notification-policy';
const labels = { alerts: 'Safety alerts', family: 'Family messages', community: 'Community', security: 'Security company', updates: 'App updates' };
export default function NotificationSettings() {
  const { preferences, savePreferences, push } = useNotifications();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const value = draft || preferences;
  const change = next => setDraft(next);
  return <details className="glass-panel rounded-2xl p-4" data-update-blocked={draft !== null || busy}>
    <summary className="cursor-pointer min-h-11 flex items-center font-semibold text-sm">Notification settings</summary>
    <p className="text-xs text-on-surface-variant mb-3">Messages stay in your inbox when phone push is off. App updates install automatically regardless of these preferences.</p>
    <div className="space-y-3">
      <button type="button" disabled={push.busy} onClick={push.enabled ? push.disable : push.enable} className="rounded-xl min-h-11 px-4 bg-secondary text-on-secondary font-semibold text-sm disabled:opacity-50">{push.busy ? 'Please wait…' : push.enabled ? 'Disable push on this device' : 'Enable phone notifications'}</button>
      {push.message && <p role="status" className="text-xs">{push.message}</p>}
      <p className="text-xs text-on-surface-variant">On iPhone or iPad, add SafeLink to your Home Screen first. Phone permissions and Focus settings still apply.</p>
      <table className="w-full text-sm"><caption className="sr-only">Choose push and icon badges for each category</caption><thead><tr><th className="text-left py-2">Category</th><th>Push</th><th>Icon badge</th></tr></thead><tbody>{notificationCategories.map(kind => <tr key={kind} className="border-t border-outline/20"><th className="text-left text-xs font-medium">{labels[kind]}</th>{['push', 'badge'].map(setting => <td key={setting} className="text-center"><label className="inline-flex w-11 h-11 items-center justify-center"><input type="checkbox" aria-label={`${labels[kind]} ${setting}`} checked={value.categories[kind][setting]} onChange={event => change({ ...value, categories: { ...value.categories, [kind]: { ...value.categories[kind], [setting]: event.target.checked } } })} /></label></td>)}</tr>)}</tbody></table>
      <p className="text-xs text-on-surface-variant">Urgent unread alerts are always included in enabled icon badges. Badges refresh when the app opens or an allowed push arrives. Routine updates never trigger a phone push.</p>
      <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={value.quietHours.enabled} onChange={event => change({ ...value, quietHours: { ...value.quietHours, enabled: event.target.checked } })} />Quiet hours for non-urgent push</label>
      {value.quietHours.enabled && <div className="flex flex-wrap gap-3 text-xs">{['start', 'end'].map(field => <label key={field}>{field === 'start' ? 'From' : 'Until'}<input type="time" className="block bg-surface rounded-lg p-2 min-h-11" value={value.quietHours[field]} onChange={event => change({ ...value, quietHours: { ...value.quietHours, [field]: event.target.value } })} /></label>)}<label className="w-full">Time zone<input className="block w-full bg-surface rounded-lg p-2 min-h-11" value={value.quietHours.timeZone} onChange={event => change({ ...value, quietHours: { ...value.quietHours, timeZone: event.target.value } })} /></label></div>}
      <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={value.communityDigest} onChange={event => change({ ...value, communityDigest: event.target.checked })} />Group non-urgent community push into a daily digest</label>
      {value.communityDigest && <label className="block text-xs">Digest hour ({value.quietHours.timeZone})<select className="ml-2 bg-surface rounded-lg p-2 min-h-11" value={value.digestHour} onChange={event => change({ ...value, digestHour: Number(event.target.value) })}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label>}
      <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={value.previews} onChange={event => change({ ...value, previews: event.target.checked })} />Show message content on the lock screen</label>
      {draft && <div className="flex gap-2"><button type="button" disabled={busy} className="min-h-11 px-4 rounded-xl bg-secondary text-on-secondary font-semibold text-sm" onClick={async () => { setBusy(true); setNotice(''); try { await savePreferences(value); setDraft(null); setNotice('Preferences saved.'); } catch (error) { setNotice(error.message); } finally { setBusy(false); } }}>Save preferences</button><button type="button" className="min-h-11 px-4 text-sm" onClick={() => setDraft(null)}>Cancel</button></div>}
      {notice && <p role="status" className="text-xs">{notice}</p>}
    </div>
  </details>;
}
