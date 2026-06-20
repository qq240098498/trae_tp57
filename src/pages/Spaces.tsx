import { useState } from "react";
import { LayoutGrid, Tag, Table2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { utilization } from "@/store/selectors";
import { FloorPlan } from "@/components/spaces/FloorPlan";
import { PricingPanel } from "@/components/spaces/PricingPanel";
import { SpaceTable } from "@/components/spaces/SpaceTable";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "plan", label: "分区平面图", icon: LayoutGrid },
  { key: "pricing", label: "区域定价", icon: Tag },
  { key: "ledger", label: "资源台账", icon: Table2 },
] as const;

export default function Spaces() {
  const spaces = useStore((s) => s.spaces);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("plan");
  const util = utilization(spaces);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="label-eyebrow">资源总览</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="font-display text-2xl text-ink tnum">{util.total}<span className="ml-1 text-sm text-ink-muted">资源</span></span>
            <span className="text-sm text-sage">空闲 {util.free}</span>
            <span className="text-sm text-amber">占用 {util.occupied}</span>
            <span className="text-sm text-indigo">预约 {util.reserved}</span>
            <span className="text-sm text-clay">维护 {util.maintenance}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-3xl text-amber tnum">{util.rate}%</p>
            <p className="text-[11px] text-ink-muted">当前使用率</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.key ? "bg-amber-soft text-amber-ink shadow-soft" : "text-ink-soft hover:bg-surface-sunken",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan" && <FloorPlan />}
      {tab === "pricing" && <PricingPanel />}
      {tab === "ledger" && <SpaceTable />}
    </div>
  );
}
