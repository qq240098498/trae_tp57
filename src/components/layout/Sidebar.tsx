import { NavLink } from "react-router-dom";
import { BookMarked, X } from "lucide-react";
import { navItems } from "./nav";
import { useStore } from "@/store/useStore";
import { utilization } from "@/store/selectors";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const util = utilization(spaces);
  const present = reservations.filter((r) => r.status === "active").length;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface/95 backdrop-blur transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber text-white shadow-soft">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-[17px] font-semibold text-ink">静谧自习空间</p>
              <p className="text-[11px] tracking-wide text-ink-muted">运营管理台</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          <p className="px-3 pb-1 pt-2 label-eyebrow">运营</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-amber-soft text-amber-ink"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-amber" />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <span className="text-[10px] text-ink-muted/70">{item.desc}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-xl border border-line-soft bg-surface-sunken p-4">
          <p className="label-eyebrow">实时状态</p>
          <div className="mt-2.5 flex items-end justify-between">
            <div>
              <p className="font-display text-2xl text-ink tnum">{present}</p>
              <p className="text-[11px] text-ink-muted">在场人数</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-sage tnum">{util.rate}%</p>
              <p className="text-[11px] text-ink-muted">使用率</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${util.rate}%` }} />
          </div>
        </div>
      </aside>
    </>
  );
}
