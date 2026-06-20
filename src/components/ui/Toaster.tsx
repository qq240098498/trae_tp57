import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const cfg = {
  success: { icon: CheckCircle2, cls: "text-sage", ring: "border-sage/30" },
  error: { icon: AlertCircle, cls: "text-rose-500", ring: "border-rose-200" },
  info: { icon: Info, cls: "text-indigo", ring: "border-indigo/30" },
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[360px] flex-col gap-2.5">
      {toasts.map((t) => {
        const c = cfg[t.type];
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-surface px-4 py-3.5 shadow-lift",
              c.ring,
            )}
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", c.cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.desc && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t.desc}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              aria-label="关闭"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
