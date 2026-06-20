import { useEffect, useMemo, useState } from "react";
import { LogOut, AlertTriangle, Printer, ShoppingCart } from "lucide-react";
import { useStore } from "@/store/useStore";
import { inSessionList } from "@/store/selectors";
import { fmtTime, fmtDuration, fmtElapsed, yuan } from "@/utils/format";
import { cn } from "@/lib/utils";
import { AddChargeModal } from "./AddChargeModal";
import { BILL_KIND_LABEL } from "@/data/types";

export function ActiveBoard() {
  const { reservations, attendance, spaces, members, bills, checkOut } = useStore();
  const session = inSessionList(reservations, attendance, spaces, members);
  const [, setTick] = useState(0);
  const [chargeModal, setChargeModal] = useState<{ rid: string; name?: string; space?: string; tab: "print" | "snack" } | null>(null);

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
                  <button onClick={() => checkOut(reservation.id)} className="btn-primary !py-2 !text-xs">
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
    </div>
  );
}
