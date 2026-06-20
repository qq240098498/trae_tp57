import { useState } from "react";
import { useStore } from "@/store/useStore";
import { spaceArea, memberById } from "@/store/selectors";
import { yuan, fmtDateTime } from "@/utils/format";
import { PlanBadge } from "@/components/ui/StatusBadge";
import { PAY_METHOD_LABEL } from "@/data/types";
import type { Bill } from "@/data/types";

const kindLabel: Record<Bill["kind"], string> = { reservation: "预付款", overtime: "超时补费" };

export function BillTable() {
  const { bills, reservations, spaces, areas, members } = useStore();
  const [kind, setKind] = useState("all");

  const list = [...bills]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((b) => kind === "all" || b.kind === kind);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3.5">
        <span className="label-eyebrow">账单流水</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
          {["all", "reservation", "overtime"].map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${kind === k ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken"}`}>
              {k === "all" ? "全部" : kindLabel[k as Bill["kind"]]}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left text-xs text-ink-muted">
              <th className="px-5 py-2.5 font-medium">时间</th>
              <th className="px-5 py-2.5 font-medium">会员</th>
              <th className="px-5 py-2.5 font-medium">资源</th>
              <th className="px-5 py-2.5 font-medium">套餐</th>
              <th className="px-5 py-2.5 font-medium">类型</th>
              <th className="px-5 py-2.5 font-medium">支付</th>
              <th className="px-5 py-2.5 text-right font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 60).map((b) => {
              const r = reservations.find((x) => x.id === b.reservation_id);
              const sa = r ? spaceArea(spaces, areas, r.space_id) : undefined;
              const m = memberById(members, b.member_id);
              return (
                <tr key={b.id} className="border-b border-line-soft/60 transition-colors hover:bg-surface-sunken/60">
                  <td className="px-5 py-3 font-mono text-[11px] text-ink-muted tnum">{fmtDateTime(b.created_at)}</td>
                  <td className="px-5 py-3 text-ink">{m?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <p className="font-mono text-xs text-ink-soft">{sa?.space.label ?? "—"}</p>
                    <p className="text-[11px] text-ink-muted">{sa?.area.name}</p>
                  </td>
                  <td className="px-5 py-3">{r ? <PlanBadge plan={r.plan} /> : <span className="text-ink-muted">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={`chip ${b.kind === "overtime" ? "bg-rose-100 text-rose-700" : "bg-surface-sunken text-ink-soft"}`}>{kindLabel[b.kind]}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{PAY_METHOD_LABEL[b.method]}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink tnum">{yuan(b.amount)}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-muted">暂无账单</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 text-xs text-ink-muted">共 {list.length} 笔 · 仅显示前 60 笔</div>
    </div>
  );
}
