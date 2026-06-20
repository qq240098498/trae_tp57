import { Users, LogIn, CheckCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayReservations } from "@/store/selectors";
import { PendingList } from "@/components/attendance/PendingList";
import { ActiveBoard } from "@/components/attendance/ActiveBoard";

function MiniStat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <div className="card flex items-center gap-3 px-5 py-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-2xl text-ink tnum">{value}</p>
        <p className="text-[11px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

export default function Attendance() {
  const reservations = useStore((s) => s.reservations);
  const today = todayReservations(reservations);
  const active = today.filter((r) => r.status === "active").length;
  const pending = today.filter((r) => r.status === "pending").length;
  const done = today.filter((r) => r.status === "done").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat icon={Users} label="在场人数" value={active} tone="bg-amber-soft text-amber" />
        <MiniStat icon={LogIn} label="待签到" value={pending} tone="bg-indigo-soft text-indigo" />
        <MiniStat icon={CheckCheck} label="今日已签退" value={done} tone="bg-sage-soft text-sage" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActiveBoard />
        <PendingList />
      </div>
    </div>
  );
}
