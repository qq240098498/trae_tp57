import { Clock, CalendarDays, TrendingUp, Award, Users, Flame } from "lucide-react";
import { useStore } from "@/store/useStore";
import { memberStudyStatsList } from "@/store/selectors";
import { fmtDuration } from "@/utils/format";

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  subValue?: string;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-4 px-5 py-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="mt-0.5 font-display text-2xl text-ink tnum truncate">{value}</p>
        {subValue && <p className="mt-0.5 text-[11px] text-ink-soft">{subValue}</p>}
      </div>
    </div>
  );
}

export function StudyStats() {
  const { members, reservations, attendance, spaces } = useStore();
  const statsList = memberStudyStatsList(members, reservations, attendance, spaces);

  const totalMinutes = statsList.reduce((s, x) => s + x.totalMinutes, 0);
  const totalSessions = statsList.reduce((s, x) => s + x.sessionCount, 0);
  const totalActiveDays = new Set(
    statsList.flatMap((x) => [...x.dailyBreakdown.keys()]),
  ).size;
  const activeMembers = statsList.length;

  const avgPerMember = activeMembers === 0 ? 0 : Math.round(totalMinutes / activeMembers);
  const avgPerSession = totalSessions === 0 ? 0 : Math.round(totalMinutes / totalSessions);

  const topMember = statsList[0];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Clock}
        label="累计自习总时长"
        value={fmtDuration(totalMinutes)}
        subValue={`${totalSessions} 次学习 · ${activeMembers} 位会员`}
        tone="bg-amber-soft text-amber"
      />
      <StatCard
        icon={CalendarDays}
        label="活跃学习天数"
        value={`${totalActiveDays} 天`}
        subValue={`人均 ${fmtDuration(avgPerMember)}`}
        tone="bg-indigo-soft text-indigo"
      />
      <StatCard
        icon={TrendingUp}
        label="平均单次时长"
        value={fmtDuration(avgPerSession)}
        subValue={`共 ${totalSessions} 次签到`}
        tone="bg-sage-soft text-sage"
      />
      <StatCard
        icon={topMember ? Award : Users}
        label={topMember ? "累计时长冠军" : "暂无数据"}
        value={topMember ? topMember.member.name : "—"}
        subValue={topMember ? fmtDuration(topMember.totalMinutes) : "等待第一位学习者"}
        tone={topMember ? "bg-rose-soft text-rose" : "bg-neutral-100 text-ink-muted"}
      />
    </div>
  );
}
