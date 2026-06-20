import { yuan } from "@/utils/format";

const toneCls: Record<string, string> = {
  amber: "bg-amber",
  sage: "bg-sage",
  indigo: "bg-indigo",
  clay: "bg-clay",
  neutral: "bg-ink-soft",
};

export function RevenueBars({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: { label: string; total: number; tone?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const sum = data.reduce((a, b) => a + b.total, 0);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-eyebrow">{subtitle}</p>
          <h3 className="mt-1 font-display text-lg text-ink">{title}</h3>
        </div>
        <span className="font-display text-lg text-amber tnum">{yuan(Math.round(sum))}</span>
      </div>
      <div className="space-y-3.5">
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{d.label}</span>
              <span className="font-medium text-ink tnum">{yuan(Math.round(d.total))}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line-soft">
              <div className={`h-full rounded-full transition-all ${toneCls[d.tone ?? "neutral"]}`} style={{ width: `${(d.total / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
