import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fmtDate } from '../../lib/format.js';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-pop dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-1 font-semibold text-ink dark:text-neutral-100">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-neutral-600 dark:text-neutral-300">
          {p.dataKey === 'weight' ? 'Weigh-in' : '7-day avg'}: <span className="font-bold">{p.value} kg</span>
        </p>
      ))}
    </div>
  );
}

export function WeightChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              if (!v) return '';
              const d = fmtDate(v);
              return d ? d.split(' ')[1] || d : '';
            }}
            className="text-neutral-500"
            stroke="currentColor"
          />
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 11 }}
            width={48}
            tickFormatter={(v) => `${v}`}
            className="text-neutral-500"
            stroke="currentColor"
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="weight" name="Weigh-in" stroke="#a3a3a3" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="avg7" name="7-day avg" stroke="#171717" strokeWidth={2.5} dot={false} className="dark:stroke-white" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
