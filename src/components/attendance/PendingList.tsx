import { LogIn, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayReservations, spaceArea, memberById } from "@/store/selectors";
import { fmtTime, relativeTime } from "@/utils/format";

export function PendingList() {
  const { reservations, spaces, areas, members, checkIn } = useStore();
  const pending = todayReservations(reservations).filter((r) => r.status === "pending");

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
                <button onClick={() => checkIn(r.id)} className="btn-primary !py-2">
                  <LogIn className="h-4 w-4" /> 签到
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
