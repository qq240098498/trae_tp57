import { ShieldAlert, Volume2, Wrench, Receipt } from "lucide-react";
import { useStore } from "@/store/useStore";
import { BlacklistList } from "@/components/blacklist/BlacklistList";

export default function Blacklist() {
  const blacklist = useStore((s) => s.blacklist);
  const members = useStore((s) => s.members);

  const total = blacklist.length;
  const noise = blacklist.filter((b) => b.reason === "noise").length;
  const damage = blacklist.filter((b) => b.reason === "damage").length;
  const skipped = blacklist.filter((b) => b.reason === "skipped_payment").length;
  const rate = members.length ? Math.round((total / members.length) * 100) : 0;

  const stats = [
    { icon: ShieldAlert, label: "黑名单总数", value: total, unit: "人", tone: "bg-rose-100 text-rose-600" },
    { icon: Volume2, label: "噪音投诉", value: noise, unit: "人", tone: "bg-amber-soft text-amber" },
    { icon: Wrench, label: "损坏设施", value: damage, unit: "人", tone: "bg-clay-soft text-clay" },
    { icon: Receipt, label: "逃单", value: skipped, unit: "人", tone: "bg-rose-100 text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="card animate-fade-up p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 label-eyebrow">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-ink tnum">
              {s.value}<span className="ml-1 text-sm text-ink-muted">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-display text-base text-ink">黑名单放行机制</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            被标记会员再次发起预约时，系统将拦截并弹窗提示管理员确认是否放行；确认放行后方可完成预约，拒绝则中止。当前已标记 {total} 人，占会员总数 {rate}%。
          </p>
        </div>
      </div>

      <BlacklistList />
    </div>
  );
}
