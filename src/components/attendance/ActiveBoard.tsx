import { useEffect, useMemo, useState } from "react";
import { LogOut, AlertTriangle, Printer, ShoppingCart, Clock, Receipt } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/store/useStore";
import { inSessionList, spaceArea, memberById } from "@/store/selectors";
import { fmtTime, fmtDuration, fmtElapsed, yuan } from "@/utils/format";
import { cn } from "@/lib/utils";
import { AddChargeModal } from "./AddChargeModal";
import { BILL_KIND_LABEL, PLAN_LABEL } from "@/data/types";
import type { Reservation } from "@/data/types";

export function ActiveBoard() {
  const { reservations, attendance, spaces, areas, members, bills, checkOut } = useStore();
  const session = inSessionList(reservations, attendance, spaces, members);
  const [, setTick] = useState(0);
  const [chargeModal, setChargeModal] = useState<{ rid: string; name?: string; space?: string; tab: "print" | "snack" } | null>(null);
  const [checkOutId, setCheckOutId] = useState<string | null>(null);

  const chargeByReservation = useMemo(() => {
    const map = new Map<string, { print: number; snack: number }>();
    for (const b of bills) {
      if (!b.reservation_id) continue;
      const cur = map.get(b.reservation_id) ?? { print: 0, snack: 0 };
      if (b.kind === "print") cur.print += b.amount;
      else if (b.kind === "snack") cur.snack += b.amount;
      map.set(b.reservation_id, cur);
    }
    return map;
  }, [bills]);

  const checkOutSession = useMemo(() => {
    if (!checkOutId) return null;
    const s = session.find(({ reservation }) => reservation.id === checkOutId);
    if (!s) return null;
    const { reservation, attendance: att, space, member, elapsed, total } = s;
    const overtime = elapsed > total;
    const sa = space ? spaceArea(spaces, areas, space.id) : undefined;
    const charge = chargeByReservation.get(reservation.id);
    const baseAmount = reservation.amount;
    const printAmount = charge?.print ?? 0;
    const snackAmount = charge?.snack ?? 0;
    let overtimeAmount = 0;
    if (overtime && sa?.area) {
      const overtimeHours = (elapsed - total) / 60;
      overtimeAmount = +(sa.area.price_hourly * overtimeHours).toFixed(2);
    }
    const totalAmount = +(baseAmount + printAmount + snackAmount + overtimeAmount).toFixed(2);
    return {
      reservation,
      attendance: att,
      space,
      area: sa?.area,
      member,
      elapsed,
      total,
      overtime,
      baseAmount,
      printAmount,
      snackAmount,
      overtimeAmount,
      totalAmount,
    };
  }, [checkOutId, session, spaces, areas, chargeByReservation]);

  function handleCheckOutConfirm() {
    if (!checkOutId) return;
    checkOut(checkOutId);
    setCheckOutId(null);
  }

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-eyebrow">在场看板</p>
          <h2 className="mt-1 font-display text-xl text-ink">实时在场 · {session.length} 人</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-amber" /> 实时刷新
        </span>
      </div>
      {session.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">当前无人在场</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {session.map(({ reservation, attendance: att, space, member, elapsed, total }) => {
            const overtime = elapsed > total;
            const pct = Math.min(100, (elapsed / total) * 100);
            const remaining = total - elapsed;
            const charge = chargeByReservation.get(reservation.id);
            const hasCharge = charge && (charge.print > 0 || charge.snack > 0);
            return (
              <div key={reservation.id} className="rounded-xl border border-line-soft bg-surface-sunken p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-soft text-sm font-semibold text-amber-ink">
                      {member?.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{member?.name}</p>
                      <p className="text-xs text-ink-muted">{space?.label} · {att && fmtTime(att.check_in)} 签到</p>
                    </div>
                  </div>
                  <span className={cn("font-mono text-sm tnum", overtime ? "text-rose-600" : "text-ink-soft")}>{fmtElapsed(elapsed)}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
                    <span>已用 {fmtDuration(elapsed)}</span>
                    <span>{overtime ? `超时 ${fmtDuration(elapsed - total)}` : `剩余 ${fmtDuration(Math.max(0, remaining))}`}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div className={cn("h-full rounded-full transition-all", overtime ? "bg-rose-500" : "bg-amber")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {hasCharge && (
                  <div className="mt-3 flex flex-wrap gap-1.5 rounded-lg border border-line-soft bg-surface px-3 py-2">
                    {charge!.print > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-ink">
                        <Printer className="h-3 w-3" /> {BILL_KIND_LABEL.print} {yuan(charge!.print)}
                      </span>
                    )}
                    {charge!.snack > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-ink">
                        <ShoppingCart className="h-3 w-3" /> {BILL_KIND_LABEL.snack} {yuan(charge!.snack)}
                      </span>
                    )}
                  </div>
                )}
                {overtime && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertTriangle className="h-3 w-3" /> 已超时，签退将按小时单价补费
                  </p>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      setChargeModal({
                        rid: reservation.id,
                        name: member?.name,
                        space: space?.label,
                        tab: "print",
                      })
                    }
                    className="btn-secondary !py-2 !text-xs"
                  >
                    <Printer className="h-3.5 w-3.5" /> 打印
                  </button>
                  <button
                    onClick={() =>
                      setChargeModal({
                        rid: reservation.id,
                        name: member?.name,
                        space: space?.label,
                        tab: "snack",
                      })
                    }
                    className="btn-secondary !py-2 !text-xs"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> 零食
                  </button>
                  <button onClick={() => setCheckOutId(reservation.id)} className="btn-primary !py-2 !text-xs">
                    <LogOut className="h-3.5 w-3.5" /> 签退
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddChargeModal
        open={chargeModal != null}
        onClose={() => setChargeModal(null)}
        reservationId={chargeModal?.rid ?? ""}
        memberName={chargeModal?.name}
        spaceLabel={chargeModal?.space}
        initialTab={chargeModal?.tab ?? "print"}
      />

      <Modal
        open={!!checkOutId}
        onClose={() => setCheckOutId(null)}
        title="确认签退"
        subtitle={checkOutSession?.member ? `${checkOutSession.member.name} · ${checkOutSession.space?.label ?? ""}` : undefined}
        size="md"
        footer={
          <>
            <button onClick={() => setCheckOutId(null)} className="btn-secondary">
              返回
            </button>
            <button
              onClick={handleCheckOutConfirm}
              className="btn-primary"
            >
              <LogOut className="h-4 w-4" /> 确认签退
            </button>
          </>
        }
      >
        {checkOutSession && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              确认后将回收门禁权限，结束本次使用并结算全部费用。
            </p>

            <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="label-eyebrow">会员</p>
                  <p className="mt-0.5 font-medium text-ink">{checkOutSession.member?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="label-eyebrow">座位</p>
                  <p className="mt-0.5 font-mono text-ink">{checkOutSession.space?.label ?? "—"}</p>
                </div>
                <div>
                  <p className="label-eyebrow">区域</p>
                  <p className="mt-0.5 text-ink">{checkOutSession.area?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="label-eyebrow">套餐</p>
                  <Badge tone="indigo">{PLAN_LABEL[checkOutSession.reservation.plan]}</Badge>
                </div>
                <div>
                  <p className="label-eyebrow">签到时间</p>
                  <p className="mt-0.5 font-mono text-ink tnum">
                    {checkOutSession.attendance?.check_in ? fmtTime(checkOutSession.attendance.check_in) : "—"}
                  </p>
                </div>
                <div>
                  <p className="label-eyebrow">已用时长</p>
                  <p className="mt-0.5 font-mono text-ink tnum">
                    {fmtDuration(checkOutSession.elapsed)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line-soft bg-surface p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber" />
                <p className="text-sm font-medium text-ink">费用明细</p>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">座位费</span>
                  <span className="font-display text-ink tnum">{yuan(checkOutSession.baseAmount)}</span>
                </div>
                {checkOutSession.printAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">
                      <Printer className="mr-1 inline h-3 w-3 text-indigo" />
                      {BILL_KIND_LABEL.print}
                    </span>
                    <span className="font-display text-ink tnum">{yuan(checkOutSession.printAmount)}</span>
                  </div>
                )}
                {checkOutSession.snackAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">
                      <ShoppingCart className="mr-1 inline h-3 w-3 text-amber" />
                      {BILL_KIND_LABEL.snack}
                    </span>
                    <span className="font-display text-ink tnum">{yuan(checkOutSession.snackAmount)}</span>
                  </div>
                )}
                {checkOutSession.overtimeAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-rose-600">
                      <Clock className="mr-1 inline h-3 w-3" />
                      超时补费
                    </span>
                    <span className="font-display text-rose-600 tnum">+ {yuan(checkOutSession.overtimeAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-line-soft pt-2">
                  <span className="font-medium text-ink">合计</span>
                  <span className="font-display text-lg text-ink tnum">{yuan(checkOutSession.totalAmount)}</span>
                </div>
              </div>
            </div>

            {checkOutSession.overtime && (
              <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                本次使用已超时 {fmtDuration(checkOutSession.elapsed - checkOutSession.total)}，
                将按 {checkOutSession.area?.name ?? ""} 小时单价自动补费。
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
