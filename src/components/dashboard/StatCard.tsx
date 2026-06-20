import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "amber" | "sage" | "indigo" | "clay";

const toneCls: Record<Tone, { bg: string; fg: string; ring: string }> = {
  amber: { bg: "bg-amber-soft", fg: "text-amber", ring: "ring-amber/20" },
  sage: { bg: "bg-sage-soft", fg: "text-sage", ring: "ring-sage/20" },
  indigo: { bg: "bg-indigo-soft", fg: "text-indigo", ring: "ring-indigo/20" },
  clay: { bg: "bg-clay-soft", fg: "text-clay", ring: "ring-clay/20" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  tone = "amber",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: Tone;
  delay?: number;
}) {
  const c = toneCls[tone];
  return (
    <div
      className="card animate-fade-up p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg ring-4", c.bg, c.ring)}>
          <Icon className={cn("h-5 w-5", c.fg)} />
        </div>
      </div>
      <p className="mt-4 label-eyebrow">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-[34px] font-semibold leading-none text-ink tnum">{value}</span>
        {unit && <span className="text-sm text-ink-muted">{unit}</span>}
      </div>
      {sub && <p className="mt-2 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
