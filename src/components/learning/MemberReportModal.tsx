import { useMemo } from "react";
import { X, Clock, Calendar, MapPin, BarChart3, Award, TrendingUp, Flame, Target } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/store/useStore";
import { rankOfMember, studyStatsLastNDays, memberStudyStatsList } from "@/store/selectors";
import { fmtDuration, fmtDate, fmtTime } from "@/utils/format";
import type { MemberStudyStats } from "@/store/selectors";

interface Props {
  open: boolean;
  onClose: () => void;
  stats: MemberStudyStats | null;
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-line-soft bg-surface-sunken p-3">
      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
        <Icon className={`h-3.5 w-3.5 ${tone}`} />
        {label}
      </div>
      <p className="mt-1.5 font-display text-lg text-ink tnum">{value}</p>
    </div>
  );
}

export function MemberReportModal({ open, onClose, stats }: Props) {
  const { areas, spaces, members, reservations, attendance } = useStore();
  const statsList = memberStudyStatsList(members, reservations, attendance, spaces);

  const rank = stats ? rankOfMember(statsList, stats.member.id) : -1;
  const last14Days = stats ? studyStatsLastNDays(stats, 14) : [];
  const maxDayMins = Math.max(1, ...last14Days.map((d) => d.minutes));

  const hourlyBars = useMemo(() => {
    if (!stats) return [];
    const bars: { hour: number; label: string; mins: number }[] = [];
    for (let h = 6; h <= 23; h++) {
      const mins = stats.hourlyBreakdown.get(h) ?? 0;
      bars.push({
        hour: h,
        label: `${h.toString().padStart(2, "0")}`,
        mins,
      });
    }
    return bars;
  }, [stats]);
  const maxHourMins = Math.max(1, ...hourlyBars.map((b) => b.mins));

  const recentSessions = stats ? [...stats.sessions].reverse().slice(0, 8) : [];

  return (
    <Modal open={open} onClose={onClose} title="个人学习报告" size="xl" subtitle={stats?.member.name}>
      {stats && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl border border-line-soft bg-gradient-to-br from-indigo-soft/50 via-surface to-amber-soft/30 p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo to-indigo-ink text-xl font-bold text-white shadow-lg">
              {stats.member.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold text-ink">{stats.member.name}</p>
              <p className="text-xs text-ink-muted">{stats.member.phone} · 加入于 {fmtDate(stats.member.joined_at)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {rank > 0 && rank <= 3 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-medium text-amber-ink">
                    <Award className="h-3 w-3" /> 全馆第 {rank} 名
                  </span>
                )}
                {rank > 3 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-soft px-2.5 py-1 text-[11px] font-medium text-indigo-ink">
                    <TrendingUp className="h-3 w-3" /> 排名 #{rank}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-medium text-sage-ink">
                  <Flame className="h-3 w-3" /> {stats.activeDays} 天活跃
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-line-soft hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric icon={Clock} label="累计时长" value={fmtDuration(stats.totalMinutes)} tone="text-amber" />
            <MiniMetric icon={Target} label="日均时长" value={fmtDuration(stats.avgDailyMinutes)} tone="text-indigo" />
            <MiniMetric icon={Calendar} label="学习次数" value={`${stats.sessionCount} 次`} tone="text-sage" />
            <MiniMetric icon={BarChart3} label="活跃天数" value={`${stats.activeDays} 天`} tone="text-rose" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line-soft bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">近 14 天学习趋势</p>
                <span className="text-[11px] text-ink-muted">每日时长</span>
              </div>
              <div className="flex h-36 items-end gap-1">
                {last14Days.map((d, i) => {
                  const height = (d.minutes / maxDayMins) * 100;
                  const isToday = i === last14Days.length - 1;
                  return (
                    <div key={i} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className={
                          "w-full rounded-t-md transition-all " +
                          (isToday
                            ? "bg-gradient-to-t from-indigo to-indigo-ink/80"
                            : d.minutes > 0
                            ? "bg-gradient-to-t from-amber to-amber-ink/60"
                            : "bg-line")
                        }
                        style={{ height: `${Math.max(height, d.minutes > 0 ? 4 : 2)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-surface opacity-0 transition group-hover:opacity-100">
                        {d.label} · {fmtDuration(d.minutes)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
                <span>{last14Days[0]?.label.split(" ")[0]}</span>
                <span>今天</span>
              </div>
            </div>

            <div className="rounded-xl border border-line-soft bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">最常到店时段</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[11px] text-amber-ink">
                  <Clock className="h-3 w-3" /> {stats.favoriteHour}:00 时段最多
                </span>
              </div>
              <div className="flex h-36 items-end gap-0.5 overflow-x-auto">
                {hourlyBars.map((b) => {
                  const height = (b.mins / maxHourMins) * 100;
                  const isFav = b.hour === stats.favoriteHour;
                  return (
                    <div key={b.hour} className="group relative flex min-w-5 flex-1 flex-col items-center">
                      <div
                        className={
                          "w-full rounded-t-sm transition-all " +
                          (isFav
                            ? "bg-gradient-to-t from-rose-500 to-rose-400"
                            : b.mins > 0
                            ? "bg-gradient-to-t from-indigo to-indigo-ink/60"
                            : "bg-line")
                        }
                        style={{ height: `${Math.max(height, b.mins > 0 ? 3 : 2)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-surface opacity-0 transition group-hover:opacity-100">
                        {b.label}时 · {fmtDuration(b.mins)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line-soft bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">区域偏好</p>
                <MapPin className="h-4 w-4 text-indigo" />
              </div>
              <div className="space-y-2">
                {[...stats.areaBreakdown.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([areaId, mins]) => {
                    const area = areas.find((a) => a.id === areaId);
                    const pct = (mins / stats.totalMinutes) * 100;
                    return (
                      <div key={areaId}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-ink">{area?.name ?? areaId}</span>
                          <span className="text-ink-soft tnum">
                            {fmtDuration(mins)} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo to-indigo-ink/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {stats.areaBreakdown.size === 0 && (
                  <p className="py-4 text-center text-xs text-ink-muted">暂无区域数据</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-line-soft bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">最近学习记录</p>
                <span className="text-[11px] text-ink-muted">最近 {recentSessions.length} 次</span>
              </div>
              <div className="space-y-1.5">
                {recentSessions.map((s) => {
                  const sp = spaces.find((x) => x.id === s.reservation.space_id);
                  const area = areas.find((a) => a.id === sp?.area_id);
                  return (
                    <div
                      key={s.attendance.id}
                      className="flex items-center justify-between rounded-lg border border-line-soft bg-surface-sunken px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-ink">
                          {area?.name ?? "—"} · {sp?.label ?? "—"}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {fmtDate(s.attendance.check_in)} {fmtTime(s.attendance.check_in)} -{" "}
                          {s.attendance.check_out ? fmtTime(s.attendance.check_out) : "进行中"}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-ink tnum">{fmtDuration(s.duration)}</span>
                    </div>
                  );
                })}
                {recentSessions.length === 0 && (
                  <p className="py-4 text-center text-xs text-ink-muted">暂无历史记录</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
            <span>首次学习：{fmtDate(stats.firstSessionAt)}</span>
            <span>最近学习：{fmtDate(stats.lastSessionAt)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
