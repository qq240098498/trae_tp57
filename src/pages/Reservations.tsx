import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, CalendarClock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayReservations } from "@/store/selectors";
import { ReservationList } from "@/components/reservations/ReservationList";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";

export default function Reservations() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const reservations = useStore((s) => s.reservations);

  useEffect(() => {
    if (params.get("new") === "1") {
      setOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const today = todayReservations(reservations);
  const upcoming = today.filter((r) => r.status === "pending").length;
  const active = today.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="card flex min-w-[140px] flex-1 items-center gap-3 px-5 py-4">
            <CalendarClock className="h-5 w-5 text-amber" />
            <div>
              <p className="font-display text-2xl text-ink tnum">{today.length}</p>
              <p className="text-[11px] text-ink-muted">今日预约</p>
            </div>
          </div>
          <div className="card flex min-w-[140px] flex-1 items-center gap-3 px-5 py-4">
            <div className="h-2 w-2 rounded-full bg-indigo" />
            <div>
              <p className="font-display text-2xl text-ink tnum">{upcoming}</p>
              <p className="text-[11px] text-ink-muted">待签到</p>
            </div>
          </div>
          <div className="card flex min-w-[140px] flex-1 items-center gap-3 px-5 py-4">
            <div className="h-2 w-2 animate-pulse-soft rounded-full bg-amber" />
            <div>
              <p className="font-display text-2xl text-ink tnum">{active}</p>
              <p className="text-[11px] text-ink-muted">使用中</p>
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> 新建预约
        </button>
      </div>

      <ReservationList />
      <NewReservationModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
