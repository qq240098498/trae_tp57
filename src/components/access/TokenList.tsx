import { useState } from "react";
import { KeyRound, Clock, User } from "lucide-react";
import { useStore } from "@/store/useStore";
import { spaceArea, memberById } from "@/store/selectors";
import { TokenStatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, fmtTime } from "@/utils/format";
import type { TokenStatus } from "@/data/types";

const filters: { key: TokenStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "issued", label: "已下发" },
  { key: "revoked", label: "已回收" },
  { key: "failed", label: "失败" },
];

export function TokenList() {
  const { accessTokens, reservations, spaces, areas, members } = useStore();
  const [f, setF] = useState<TokenStatus | "all">("all");

  const list = [...accessTokens]
    .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())
    .filter((t) => f === "all" || t.status === f);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-eyebrow">权限令牌</p>
          <h2 className="mt-1 font-display text-xl text-ink">门禁权限下发</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
          {filters.map((x) => (
            <button key={x.key} onClick={() => setF(x.key)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${f === x.key ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken"}`}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {list.map((t) => {
          const r = reservations.find((x) => x.id === t.reservation_id);
          const sa = spaceArea(spaces, areas, t.space_id);
          const m = r ? memberById(members, r.member_id) : undefined;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line-soft bg-surface-sunken p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-soft text-amber">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-ink">{t.id}</p>
                  <span className="text-xs text-ink-muted">→ {sa?.space.label} · {sa?.area.name}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {m?.name ?? "—"}</span>
                  <span className="flex items-center gap-1 font-mono tnum"><Clock className="h-3 w-3" /> {fmtTime(t.valid_from)}–{fmtTime(t.valid_to)} · {fmtDateTime(t.valid_from).slice(0, 10)}</span>
                </div>
              </div>
              <TokenStatusBadge status={t.status} />
            </div>
          );
        })}
        {list.length === 0 && <p className="py-10 text-center text-sm text-ink-muted">暂无门禁令牌</p>}
      </div>
    </div>
  );
}
