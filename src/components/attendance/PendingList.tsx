import { useState } from "react";
import { LogIn, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/store/useStore";
import { todayReservations, spaceArea, memberById } from "@/store/selectors";
import { fmtTime, relativeTime, yuan } from "@/utils/format";
import { PLAN_LABEL } from "@/data/types";
import type { Reservation } from "@/data/types";

export function PendingList() {
  const { reservations, spaces, areas, members, checkIn } = useStore();
  const pending = todayReservations(reservations).filter((r) => r.status === "pending");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const confirmRsv = confirmId ? pending.find((r) => r.id === confirmId) ?? null : null;
  const confirmSa = confirmRsv ? spaceArea(spaces, areas, confirmRsv.space_id) : undefined;
  const confirmMember = confirmRsv ? memberById(members, confirmRsv.member_id) : undefined;

  function handleConfirm() {
    if (!confirmId) return;
    checkIn(confirmId);
    setConfirmId(null);
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-eyebrow">待签到</p>
          <h2 className="mt-1 font-display text-xl text-ink">即将到店 · {pending.length} 单</h2>
        </div>
      </div>
      {pending.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">暂无待签到预约</p>
      ) : (
        <div className="space-y-2.5">
          {pending.map((r) => {
            const sa = spaceArea(spaces, areas, r.space_id);
            const m = memberById(members, r.member_id);
            const isUpcoming = new Date(r.start).getTime() > Date.now();
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line-soft bg-surface-sunken p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-soft text-sm font-semibold text-indigo">
                  {m?.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{m?.name} <span className="font-normal text-ink-muted">· {sa?.space.label} · {sa?.area.name}</span></p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                    <Clock className="h-3 w-3" />
                    {fmtTime(r.start)} 开始 · {relativeTime(r.start)}
                  </p>
                </div>
                {isUpcoming && <span className="hidden rounded-full bg-surface px-2 py-0.5 text-[10px] text-ink-muted sm:inline">未到时间</span>}
                <button onClick={() => setConfirmId(r.id)} className="btn-primary !py-2">
                  <LogIn className="h-4 w-4" /> 签到
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="确认签到"
        subtitle={confirmMember ? `${confirmMember.name} · ${confirmSa?.space.label ?? ""}` : undefined}
        size="md"
        footer={
          <>
            <button onClick={() => setConfirmId(null)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleConfirm} className="btn-primary">
              <LogIn className="h-4 w-4" /> 确认签到
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            确认后将开启门禁权限，开始计算使用时长。请确认会员身份无误。
          </p>
          <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="label-eyebrow">会员</p>
                <p className="mt-0.5 text-ink font-medium">{confirmMember?.name ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">座位</p>
                <p className="mt-0.5 font-mono text-ink">{confirmSa?.space.label ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">区域</p>
                <p className="mt-0.5 text-ink">{confirmSa?.area.name ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">套餐</p>
                <Badge tone="indigo">{PLAN_LABEL[confirmRsv?.plan ?? "hourly"]}</Badge>
              </div>
              <div>
                <p className="label-eyebrow">预约时间</p>
                <p className="mt-0.5 font-mono text-ink tnum">
                  {confirmRsv ? `${fmtTime(confirmRsv.start)} - ${fmtTime(confirmRsv.end)}` : "—"}
                </p>
              </div>
              <div>
                <p className="label-eyebrow">金额</p>
                <p className="mt-0.5 font-display text-ink tnum">{yuan(confirmRsv?.amount ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
