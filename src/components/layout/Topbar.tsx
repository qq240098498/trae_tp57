import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, RotateCcw, Plus } from "lucide-react";
import { navItems } from "./nav";
import { useStore } from "@/store/useStore";
import { fmtDateTime } from "@/utils/format";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const resetData = useStore((s) => s.resetData);
  const current = navItems.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-parchment/85 px-4 backdrop-blur-md lg:px-8">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink lg:hidden"
        aria-label="菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold text-ink">
          {current?.label ?? "运营管理台"}
        </h1>
        <p className="hidden text-xs text-ink-muted sm:block">
          {dateStr} {week} · {current?.desc}
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 md:flex">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-sage" />
        <span className="font-mono text-sm text-ink-soft tnum">{fmtDateTime(now.toISOString())}</span>
      </div>

      <button
        onClick={() => navigate("/reservations?new=1")}
        className="btn-primary hidden sm:inline-flex"
      >
        <Plus className="h-4 w-4" />
        新建预约
      </button>

      <button
        onClick={resetData}
        className="btn-secondary !px-2.5 !py-2"
        title="重置演示数据"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </header>
  );
}
