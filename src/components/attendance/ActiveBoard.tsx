import { useEffect, useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { inSessionList } from "@/store/selectors";
import { fmtTime, fmtDuration, fmtElapsed } from "@/utils/format";
import { cn } from "@/lib/utils";

export function ActiveBoard() {
  const { reservations, attendance, spaces, members, checkOut } = useStore();
  const session = inSessionList(reservations, attendance, spaces, members);
  const [, setTick] = useState(0);

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
                {overtime && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertTriangle className="h-3 w-3" /> 已超时，签退将按小时单价补费
                  </p>
                )}
                <button onClick={() => checkOut(reservation.id)} className="btn-secondary mt-3 w-full !py-2">
                  <LogOut className="h-4 w-4" /> 签退
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
