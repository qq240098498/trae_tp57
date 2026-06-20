import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "sage" | "amber" | "indigo" | "clay" | "neutral" | "rose";

const toneCls: Record<Tone, string> = {
  sage: "bg-sage-soft text-sage-ink",
  amber: "bg-amber-soft text-amber-ink",
  indigo: "bg-indigo-soft text-indigo",
  clay: "bg-clay-soft text-clay",
  neutral: "bg-surface-sunken text-ink-soft",
  rose: "bg-rose-100 text-rose-700",
};

export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("chip", toneCls[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
