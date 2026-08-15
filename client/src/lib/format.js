import { format, parseISO, subDays } from 'date-fns';

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function keyToDate(key) {
  return parseISO(key);
}

export function fmtDate(key) {
  if (!key) return '';
  try {
    return format(parseISO(key), 'MMM d, yyyy');
  } catch {
    return key;
  }
}

export function fmtDay(key) {
  if (!key) return '';
  try {
    return format(parseISO(key), 'EEE, MMM d');
  } catch {
    return key;
  }
}

export function shiftKey(key, days) {
  const d = parseISO(key);
  return format(subDays(d, days), 'yyyy-MM-dd');
}

export function fmtNum(value, digits = 1) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

export function fmtInt(value) {
  if (value === null || value === undefined) return '—';
  return Math.round(Number(value)).toLocaleString();
}

export function clampPct(value) {
  const n = Number(value) || 0;
  return Math.max(0, Math.min(100, n));
}

export function isToday(key) {
  return key === todayKey();
}

export function weightDeltaPct(start, current, goal) {
  if (!start || start === goal) return 0;
  return clampPct(((start - current) / (start - goal)) * 100);
}
