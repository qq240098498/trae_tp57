import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthCls = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 animate-fade-in bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative my-auto w-full animate-scale-in rounded-2xl border border-line bg-surface shadow-lift",
          widthCls,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-5">
          <div>
            <h3 className="text-xl text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line-soft px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
