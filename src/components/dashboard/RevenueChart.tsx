import { yuan } from "@/utils/format";

export function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  const W = 700;
  const H = 240;
  const padL = 44;
  const padR = 18;
  const padT = 18;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...data.map((d) => d.total), 1);
  const niceMax = Math.ceil(max / 50) * 50 || 50;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const pts = data.map((d, i) => {
    const x = padL + i * stepX;
    const y = padT + innerH - (d.total / niceMax) * innerH;
    return { x, y, d };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="近7天营收趋势">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B45309" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridVals.map((v, i) => {
          const y = padT + innerH - (v / niceMax) * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E5DDC8" strokeWidth={1} strokeDasharray={i === 0 ? "0" : "3 4"} />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="fill-ink-muted" style={{ fontSize: 10, fontFamily: "DM Mono" }}>
                {v}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#revFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#B45309"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw"
          style={{ strokeDasharray: 1000 }}
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#B45309" strokeWidth={2} />
            <title>{`${p.d.label} · ${yuan(p.d.total)}`}</title>
            <text x={p.x} y={H - 8} textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 10 }}>
              {p.d.label.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
