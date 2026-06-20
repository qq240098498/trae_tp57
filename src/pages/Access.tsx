import { KeyRound, DoorOpen, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { TokenList } from "@/components/access/TokenList";
import { AccessTimeline } from "@/components/access/AccessTimeline";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function Access() {
  const { accessTokens, accessLogs } = useStore();
  const issued = accessTokens.filter((t) => t.status === "issued").length;
  const todayOpen = accessLogs.filter((l) => l.action === "open" && isToday(l.time)).length;
  const failed = accessLogs.filter((l) => l.result === "failed").length;

  const stats = [
    { icon: KeyRound, label: "生效中权限", value: issued, unit: "条", tone: "bg-sage-soft text-sage" },
    { icon: DoorOpen, label: "今日开门", value: todayOpen, unit: "次", tone: "bg-amber-soft text-amber" },
    { icon: AlertTriangle, label: "异常记录", value: failed, unit: "条", tone: "bg-rose-100 text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className="card animate-fade-up flex items-center gap-4 p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl text-ink tnum">{s.value}<span className="ml-1 text-sm text-ink-muted">{s.unit}</span></p>
              <p className="text-[11px] text-ink-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TokenList />
        <AccessTimeline />
      </div>
    </div>
  );
}
