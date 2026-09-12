export const notificationCategories = ['alerts', 'family', 'community', 'security', 'updates'];
export const defaultPreferences = {
  categories: {
    alerts: { push: true, badge: true }, family: { push: false, badge: true },
    community: { push: false, badge: false }, security: { push: true, badge: true }, updates: { push: false, badge: false },
  },
  quietHours: { enabled: false, start: '22:00', end: '07:00', timeZone: 'Africa/Johannesburg' },
  communityDigest: true,
  digestHour: 18,
  previews: false,
};
export function normalizePreferences(input = {}) {
  const categories = Object.fromEntries(notificationCategories.map(kind => [kind, {
    push: typeof input.categories?.[kind]?.push === 'boolean' ? input.categories[kind].push : defaultPreferences.categories[kind].push,
    badge: typeof input.categories?.[kind]?.badge === 'boolean' ? input.categories[kind].badge : defaultPreferences.categories[kind].badge,
  }]));
  const quiet = input.quietHours || {};
  let timeZone = defaultPreferences.quietHours.timeZone;
  try { if (typeof quiet.timeZone === 'string') { new Intl.DateTimeFormat('en', { timeZone: quiet.timeZone }).format(); timeZone = quiet.timeZone; } } catch { /* Use safe default. */ }
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return { categories, quietHours: { enabled: quiet.enabled === true, start: validTime(quiet.start) ? quiet.start : '22:00', end: validTime(quiet.end) ? quiet.end : '07:00', timeZone }, communityDigest: input.communityDigest !== false, digestHour: Number.isInteger(input.digestHour) && input.digestHour >= 0 && input.digestHour <= 23 ? input.digestHour : 18, previews: input.previews === true };
}
export function localClock(now, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now)).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
export function deliveryPolicy(item, preferences, now = Date.now()) {
  const prefs = normalizePreferences(preferences);
  const category = prefs.categories[item.kind] || prefs.categories.family;
  const urgent = item.priority === 'urgent';
  if (!category.push) return 'muted';
  if (urgent) return 'send';
  const clock = localClock(now, prefs.quietHours.timeZone);
  const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const start = minutes(prefs.quietHours.start), end = minutes(prefs.quietHours.end);
  if (prefs.quietHours.enabled && (start === end || (start < end ? clock.minutes >= start && clock.minutes < end : clock.minutes >= start || clock.minutes < end))) return 'defer';
  if (item.kind === 'community' && prefs.communityDigest) return clock.hour >= prefs.digestHour ? 'digest' : 'defer';
  return 'send';
}
export function countsForBadge(item, preferences) {
  return !item.read && (item.priority === 'urgent' || normalizePreferences(preferences).categories[item.kind]?.badge === true);
}
