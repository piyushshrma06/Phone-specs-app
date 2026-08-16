// SignalMeter.jsx
// A 10-segment horizontal meter, zone-colored (red/amber/green), with a
// staggered fill animation on mount/update. Ported from the Lovable
// design exploration into plain JS - same visual, no TypeScript/Tailwind
// dependency needed.

const TICKS = 10;

function zoneColor(index) {
  if (index < 4) return 'var(--meter-low)';
  if (index < 7) return 'var(--meter-mid)';
  return 'var(--meter-high)';
}

export default function SignalMeter({ score, label }) {
  const clamped = Math.max(0, Math.min(10, Number.isFinite(score) ? score : 0));

  return (
    <section aria-label={label} className="signal-meter">
      <div className="signal-meter-header">
        <span className="signal-meter-label">{label}</span>
        <span className="signal-meter-label">/ 10</span>
      </div>
      <div className="signal-meter-row">
        <p className="signal-meter-number" key={label + clamped}>{clamped.toFixed(1)}</p>
        <div className="signal-meter-ticks-wrap">
          <div className="signal-meter-ticks" role="img" aria-label={`${clamped.toFixed(1)} out of 10`}>
            {Array.from({ length: TICKS }).map((_, i) => {
              const fill = Math.max(0, Math.min(1, clamped - i));
              return (
                <div key={i} className="signal-meter-tick">
                  <div
                    className="signal-meter-tick-fill"
                    style={{
                      width: `${fill * 100}%`,
                      backgroundColor: zoneColor(i),
                      transitionDelay: `${i * 24}ms`,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="signal-meter-scale">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>
      </div>
    </section>
  );
}