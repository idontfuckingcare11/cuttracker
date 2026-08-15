export function Ring({ percent, size = 120, stroke = 8, children, trackClass = 'stroke-neutral-100 dark:stroke-neutral-800', barClass = 'stroke-neutral-900 dark:stroke-white' }) {
  const R = (size - stroke) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
          className={`${barClass} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
