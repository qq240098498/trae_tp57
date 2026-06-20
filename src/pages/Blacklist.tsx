import { ShieldAlert } from "lucide-react";
import { useStore } from "@/store/useStore";
import { BlacklistList } from "@/components/blacklist/BlacklistList";
import type { BlacklistTone } from "@/data/types";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  tone: string;
  dotTone?: string;
  useDot?: boolean;
}

export default function Blacklist() {
  const blacklist = useStore((s) => s.blacklist);
  const blacklistReasons = useStore((s) => s.blacklistReasons);
  const members = useStore((s) => s.members);

  const total = blacklist.length;
  const rate = members.length ? Math.round((total / members.length) * 100) : 0;

  const byReason = blacklistReasons
    .map((r) => ({
      reason: r,
      count: blacklist.filter((b) => b.reason === r.id).length,
    }))
    .sort((a, b) => b.count - a.count);

  const toneBgCls = (t: BlacklistTone): string => {
    switch (t) {
      case "rose":
        return "bg-rose-100 text-rose-600";
      case "amber":
        return "bg-amber-soft text-amber";
      case "clay":
        return "bg-clay-soft text-clay";
      case "indigo":
        return "bg-indigo-soft text-indigo";
      case "sage":
        return "bg-sage-soft text-sage";
      default:
        return "bg-surface-sunken text-ink-soft";
    }
  };

  const toneTextCls = (t: BlacklistTone): string => {
    switch (t) {
      case "rose":
        return "text-rose-600";
      case "amber":
        return "text-amber";
      case "clay":
        return "text-clay";
      case "indigo":
        return "text-indigo";
      case "sage":
        return "text-sage";
      default:
        return "text-ink-muted";
    }
  };

  const stats: StatCard[] = [
    { icon: ShieldAlert, label: "黑名单总数", value: total, unit: "人", tone: "bg-rose-100 text-rose-600" },
    ...byReason.slice(0, 3).map<StatCard>(({ reason, count }) => ({
      icon: ShieldAlert,
      label: reason.label,
      value: count,
      unit: "人",
      tone: toneBgCls(reason.tone),
      dotTone: toneTextCls(reason.tone),
      useDot: true,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={`${s.label}-${i}`} className="card animate-fade-up p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
              {s.useDot ? (
                <span className={`h-2.5 w-2.5 rounded-full bg-current opacity-75 ${s.dotTone ?? ""}`} />
              ) : (
                <s.icon className="h-5 w-5" />
              )}
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
            被标记会员再次发起预约时，系统将拦截并弹窗提示管理员确认是否放行；确认放行后方可完成预约，拒绝则中止。当前已标记 {total} 人，占会员总数 {rate}%；已配置原因种类 {blacklistReasons.length} 个，可在「原因管理」中自由新增与编辑。
          </p>
        </div>
      </div>

      <BlacklistList />
    </div>
  );
}
