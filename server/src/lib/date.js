export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function daysAgoKey(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateKey(d);
}

export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function clampDateKey(key, minKey, maxKey) {
  if (key < minKey) return minKey;
  if (key > maxKey) return maxKey;
  return key;
}
