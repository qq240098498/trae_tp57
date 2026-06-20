import { useState } from "react";
import type { SpaceStatus } from "@/data/types";
import { SPACE_STATUS_LABEL, AREA_TYPE_LABEL } from "@/data/types";
import { useStore } from "@/store/useStore";
import { SpaceStatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const statusOptions: SpaceStatus[] = ["free", "occupied", "reserved", "maintenance"];

export function SpaceTable() {
  const spaces = useStore((s) => s.spaces);
  const areas = useStore((s) => s.areas);
  const updateSpaceStatus = useStore((s) => s.updateSpaceStatus);
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = spaces.filter(
    (s) =>
      (areaFilter === "all" || s.area_id === areaFilter) &&
      (statusFilter === "all" || s.status === statusFilter),
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3.5">
        <span className="label-eyebrow">资源台账</span>
        <div className="ml-auto flex items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="input !w-auto !py-1.5 text-xs">
            <option value="all">全部区域</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input !w-auto !py-1.5 text-xs">
            <option value="all">全部状态</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{SPACE_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left text-xs text-ink-muted">
              <th className="px-5 py-2.5 font-medium">资源编号</th>
              <th className="px-5 py-2.5 font-medium">区域</th>
              <th className="px-5 py-2.5 font-medium">类型</th>
              <th className="px-5 py-2.5 font-medium">状态</th>
              <th className="px-5 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sp) => {
              const area = areas.find((a) => a.id === sp.area_id);
              return (
                <tr key={sp.id} className="border-b border-line-soft/60 transition-colors hover:bg-surface-sunken/60">
                  <td className="px-5 py-3 font-mono font-semibold text-ink">{sp.label}</td>
                  <td className="px-5 py-3 text-ink-soft">{area?.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{area ? AREA_TYPE_LABEL[area.type] : "—"}</td>
                  <td className="px-5 py-3"><SpaceStatusBadge status={sp.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <select
                        value={sp.status}
                        onChange={(e) => updateSpaceStatus(sp.id, e.target.value as SpaceStatus)}
                        className={cn("rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink-soft focus:border-amber focus:outline-none")}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{SPACE_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 text-xs text-ink-muted">共 {filtered.length} 个资源</div>
    </div>
  );
}
