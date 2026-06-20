import { useState } from "react";
import { Search, Ban } from "lucide-react";
import { useStore } from "@/store/useStore";
import { spaceArea, memberById, tokenOfReservation } from "@/store/selectors";
import { ReservationStatusBadge, PlanBadge, TokenStatusBadge } from "@/components/ui/StatusBadge";
import { yuan, fmtTime, fmtDateLabel, durationMins, fmtDuration } from "@/utils/format";
import type { ReservationStatus } from "@/data/types";

const statusFilters: { key: ReservationStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待签到" },
  { key: "active", label: "使用中" },
  { key: "done", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

export function ReservationList() {
  const { reservations, spaces, areas, members, accessTokens, cancelReservation } = useStore();
  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [q, setQ] = useState("");

  const list = [...reservations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => {
      if (areaFilter === "all") return true;
      const sa = spaceArea(spaces, areas, r.space_id);
      return sa?.area.id === areaFilter;
    })
    .filter((r) => {
      if (!q.trim()) return true;
      const m = memberById(members, r.member_id);
      return (m?.name.includes(q) || r.id.toLowerCase().includes(q.toLowerCase()));
    });

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3.5">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
          {statusFilters.map((s) => (
            <button key={s.key} onClick={() => setStatus(s.key)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${status === s.key ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="input !w-auto !py-1.5 text-xs">
          <option value="all">全部区域</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索会员 / 预约号" className="input !w-56 !py-1.5 pl-9 text-xs" />
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left text-xs text-ink-muted">
              <th className="px-5 py-2.5 font-medium">会员 / 预约号</th>
              <th className="px-5 py-2.5 font-medium">资源</th>
              <th className="px-5 py-2.5 font-medium">套餐</th>
              <th className="px-5 py-2.5 font-medium">时段</th>
              <th className="px-5 py-2.5 font-medium">门禁</th>
              <th className="px-5 py-2.5 font-medium">状态</th>
              <th className="px-5 py-2.5 text-right font-medium">金额</th>
              <th className="px-5 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const sa = spaceArea(spaces, areas, r.space_id);
              const m = memberById(members, r.member_id);
              const token = tokenOfReservation(accessTokens, r.id);
              const canCancel = r.status === "pending" || r.status === "active";
              return (
                <tr key={r.id} className="border-b border-line-soft/60 transition-colors hover:bg-surface-sunken/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{m?.name ?? "—"}</p>
                    <p className="font-mono text-[11px] text-ink-muted">{r.id}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-mono font-semibold text-ink">{sa?.space.label}</p>
                    <p className="text-[11px] text-ink-muted">{sa?.area.name}</p>
                  </td>
                  <td className="px-5 py-3"><PlanBadge plan={r.plan} /></td>
                  <td className="px-5 py-3">
                    <p className="text-ink-soft">{fmtDateLabel(r.start)}</p>
                    <p className="font-mono text-[11px] text-ink-muted tnum">{fmtTime(r.start)}–{fmtTime(r.end)} · {fmtDuration(durationMins(r.start, r.end))}</p>
                  </td>
                  <td className="px-5 py-3">{token ? <TokenStatusBadge status={token.status} /> : <span className="text-ink-muted">—</span>}</td>
                  <td className="px-5 py-3"><ReservationStatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-right font-semibold text-ink tnum">{yuan(r.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    {canCancel ? (
                      <button onClick={() => cancelReservation(r.id)} className="btn-ghost !px-2 !py-1 text-xs text-clay hover:!text-rose-600">
                        <Ban className="h-3.5 w-3.5" /> 取消
                      </button>
                    ) : (
                      <span className="text-xs text-ink-muted/50">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-muted">没有匹配的预约</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
