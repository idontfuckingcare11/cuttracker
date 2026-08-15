const DAY_MS = 86400000;

export function toDateKey(date) {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(date).slice(0, 10);
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDays(key, days) {
  const dt = parseDateKey(key);
  dt.setDate(dt.getDate() + days);
  return toDateKey(dt);
}

export function daysBetween(aKey, bKey) {
  return Math.round((parseDateKey(bKey) - parseDateKey(aKey)) / DAY_MS);
}

export function average(values) {
  if (!values.length) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function averageWindow(entries, fromKey, toKey) {
  const values = entries
    .filter((e) => e.loggedDate >= fromKey && e.loggedDate <= toKey)
    .map((e) => Number(e.weightKg));
  return average(values);
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) => (a.loggedDate < b.loggedDate ? -1 : a.loggedDate > b.loggedDate ? 1 : 0));
}

export function rollingAverageSeries(entries) {
  const sorted = sortEntries(entries);
  const out = [];
  for (const entry of sorted) {
    const from = shiftDays(entry.loggedDate, -6);
    const values = sorted.filter((e) => e.loggedDate >= from && e.loggedDate <= entry.loggedDate).map((e) => Number(e.weightKg));
    out.push({ loggedDate: entry.loggedDate, weightKg: Number(entry.weightKg), avg7: average(values) });
  }
  return out;
}

export function current7dAvg(entries) {
  const sorted = sortEntries(entries);
  if (!sorted.length) return null;
  const last = sorted[sorted.length - 1].loggedDate;
  const from = shiftDays(last, -6);
  return averageWindow(sorted, from, last);
}

export function prior7dAvg(entries) {
  const sorted = sortEntries(entries);
  if (!sorted.length) return null;
  const last = sorted[sorted.length - 1].loggedDate;
  const to = shiftDays(last, -7);
  const from = shiftDays(last, -13);
  return averageWindow(sorted, from, to);
}

export function weeklyLossRate(entries) {
  const sorted = sortEntries(entries);
  if (sorted.length < 2) return null;
  const cur = current7dAvg(sorted);
  const prior = prior7dAvg(sorted);
  if (prior !== null && cur !== null) {
    return cur - prior;
  }
  const first = Number(sorted[0].weightKg);
  const last = Number(sorted[sorted.length - 1].weightKg);
  const days = daysBetween(sorted[0].loggedDate, sorted[sorted.length - 1].loggedDate);
  if (days <= 0) return 0;
  return ((last - first) * 7) / days;
}

export function classifyCut({ weeklyLossRateKg: rate, expectedRateKg, currentWeightKg }) {
  if (rate === null) {
    return { status: 'on_track', needsMoreData: true };
  }
  const loss = -rate;
  if (loss <= 0) return { status: 'too_slow', needsMoreData: false };
  const high = Math.max(expectedRateKg * 1.5, 0.01 * currentWeightKg);
  const low = expectedRateKg * 0.6;
  if (loss > high) return { status: 'too_fast', needsMoreData: false };
  if (loss < low) return { status: 'too_slow', needsMoreData: false };
  return { status: 'on_track', needsMoreData: false };
}

export function estimateWeeksToGoal(currentAvg, goalWeightKg, ratePerWeek) {
  const remaining = currentAvg - goalWeightKg;
  if (remaining <= 0) return 0;
  if (!ratePerWeek || ratePerWeek <= 0) return null;
  return Math.max(1, Math.round(remaining / ratePerWeek));
}

export function buildWeightSeriesForChart(entries) {
  return rollingAverageSeries(entries).map((e) => ({
    date: e.loggedDate,
    weight: Number(e.weightKg.toFixed(2)),
    avg7: Number(e.avg7.toFixed(2))
  }));
}

export function sumByDay(rows, dateKey, valueKey) {
  const map = {};
  for (const row of rows) {
    const key = toDateKey(row[dateKey]);
    map[key] = (map[key] || 0) + Number(row[valueKey]);
  }
  return map;
}
