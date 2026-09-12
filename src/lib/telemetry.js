export function timestampMillis(value) {
  if (value == null || value === '') return null;
  // Jimi/TrackSolid GPS date strings use UTC; never reinterpret them in the phone's zone.
  if (typeof value === 'string' && /^\d{10,13}$/.test(value)) value = Number(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) value = value.replace(' ', 'T') + 'Z';
  const seconds = value?.seconds ?? value?._seconds;
  const parsed = seconds != null ? seconds * 1000 : typeof value === 'number' ? (value < 1e12 ? value * 1000 : value) : Date.parse(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
export function relativeTime(value, now = Date.now()) {
  const time = timestampMillis(value);
  if (!time) return 'Unavailable';
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}
export function batteryPercent(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? Math.round(number) : null;
}
