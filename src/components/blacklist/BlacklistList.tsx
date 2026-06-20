import { useState } from "react";
import { Plus, Search, Trash2, UserX, Settings } from "lucide-react";
import { useStore } from "@/store/useStore";
import { memberById } from "@/store/selectors";
import { BlacklistReasonBadge } from "@/components/ui/StatusBadge";
import { AddBlacklistModal } from "./AddBlacklistModal";
import { ManageReasonsModal } from "./ManageReasonsModal";
import { yuan, fmtDateTime, relativeTime } from "@/utils/format";
import type { BlacklistReason } from "@/data/types";
import type { BlacklistReasonConfig } from "@/data/types";

type ReasonFilter = BlacklistReason | "all";

export function BlacklistList() {
  const { blacklist, blacklistReasons, members, reservations, removeBlacklist } = useStore();
  const [reason, setReason] = useState<ReasonFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState(false);

  const filters: { key: ReasonFilter; label: string }[] = [
    { key: "all", label: "全部" },
    ...blacklistReasons
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((r: BlacklistReasonConfig) => ({ key: r.id, label: r.label })),
  ];

  const list = [...blacklist]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((b) => reason === "all" || b.reason === reason)
    .filter((b) => {
      if (!q.trim()) return true;
      const m = memberById(members, b.member_id);
      return m?.name.includes(q) || b.id.toLowerCase().includes(q.toLowerCase());
    });

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3.5">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5 max-w-full overflow-x-auto scrollbar-thin">
          {filters.map((s) => (
            <button
              key={s.key}
              onClick={() => setReason(s.key)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${reason === s.key ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索会员 / 记录号"
            className="input !w-56 !py-1.5 pl-9 text-xs"
          />
        </div>
        <button onClick={() => setReasonsOpen(true)} className="btn-ghost !py-1.5 text-xs" title="原因管理">
          <Settings className="h-3.5 w-3.5" /> 原因管理
        </button>
        <button onClick={() => setOpen(true)} className="btn-primary !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> 标记黑名单
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left text-xs text-ink-muted">
              <th className="px-5 py-2.5 font-medium">会员 / 记录号</th>
              <th className="px-5 py-2.5 font-medium">原因</th>
              <th className="px-5 py-2.5 font-medium">情况说明</th>
              <th className="px-5 py-2.5 font-medium">标记时间</th>
              <th className="px-5 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => {
              const m = memberById(members, b.member_id);
              const reservedCount = reservations.filter(
                (r) => r.member_id === b.member_id && r.status !== "cancelled",
              ).length;
              return (
                <tr key={b.id} className="border-b border-line-soft/60 transition-colors hover:bg-surface-sunken/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{m?.name ?? "—"}</p>
                    <p className="font-mono text-[11px] text-ink-muted">{b.id}</p>
                    <p className="text-[11px] text-ink-muted">{m?.phone} · 余额 {yuan(m?.balance ?? 0)} · 历史 {reservedCount} 单</p>
                  </td>
                  <td className="px-5 py-3"><BlacklistReasonBadge reason={b.reason} reasons={blacklistReasons} /></td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-ink-soft">{b.note || "—"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-ink-soft">{fmtDateTime(b.created_at)}</p>
                    <p className="text-[11px] text-ink-muted">{relativeTime(b.created_at)}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeBlacklist(b.id)}
                      className="btn-ghost !px-2 !py-1 text-xs text-clay hover:!text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 移出
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center">
                  <UserX className="mx-auto h-8 w-8 text-ink-muted/40" />
                  <p className="mt-2 text-sm text-ink-muted">暂无黑名单记录</p>
                  <p className="mt-1 text-xs text-ink-muted/70">标记后，该会员再次预约时将弹窗提示管理员确认放行</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-xs text-ink-muted">
        <span>共 {list.length} 条记录</span>
        <span>原因种类 {blacklistReasons.length} 个</span>
      </div>

      <AddBlacklistModal open={open} onClose={() => setOpen(false)} onOpenReasons={() => setReasonsOpen(true)} />
      <ManageReasonsModal open={reasonsOpen} onClose={() => setReasonsOpen(false)} />
    </div>
  );
}
