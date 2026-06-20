import { Trophy, Medal, Award, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { memberStudyStatsList, rankOfMember } from "@/store/selectors";
import { fmtDuration } from "@/utils/format";
import type { MemberStudyStats } from "@/store/selectors";

function rankIcon(rank: number) {
  if (rank === 1) return Trophy;
  if (rank === 2) return Medal;
  if (rank === 3) return Award;
  return null;
}

function rankTone(rank: number): string {
  if (rank === 1) return "bg-gradient-to-br from-amber to-amber-ink/80 text-white shadow-amber/30";
  if (rank === 2) return "bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-slate-400/30";
  if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-400/30";
  return "bg-line text-ink-soft";
}

interface Props {
  onSelectMember?: (stats: MemberStudyStats) => void;
}

export function RankingBoard({ onSelectMember }: Props) {
  const { members, reservations, attendance, spaces, areas } = useStore();
  const statsList = memberStudyStatsList(members, reservations, attendance, spaces);
  const maxMinutes = statsList[0]?.totalMinutes ?? 1;

  if (statsList.length === 0) {
    return (
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="label-eyebrow">学习时长排行榜</p>
            <h2 className="mt-1 font-display text-xl text-ink">累计时长 TOP 榜</h2>
          </div>
        </div>
        <div className="py-16 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-line" />
          <p className="text-sm text-ink-muted">暂无学习记录</p>
          <p className="mt-1 text-xs text-ink-soft">完成首次签到后将生成排名</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-eyebrow">学习时长排行榜</p>
          <h2 className="mt-1 font-display text-xl text-ink">累计时长 TOP 榜</h2>
        </div>
        <span className="text-xs text-ink-muted">共 {statsList.length} 位会员</span>
      </div>
      <div className="space-y-2">
        {statsList.map((stats, idx) => {
          const rank = rankOfMember(statsList, stats.member.id);
          const Icon = rankIcon(rank);
          const progress = (stats.totalMinutes / maxMinutes) * 100;
          const favoriteArea = areas.find((a) => a.id === stats.favoriteAreaId);
          return (
            <button
              key={stats.member.id}
              onClick={() => onSelectMember?.(stats)}
              className="group w-full rounded-xl border border-transparent p-3 text-left transition hover:border-line-soft hover:bg-surface-sunken"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold shadow-sm ${rankTone(
                    rank,
                  )}`}
                >
                  {Icon ? <Icon className="h-5 w-5" /> : rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {stats.member.name}
                    </p>
                    <p className="shrink-0 font-mono text-sm text-ink tnum">
                      {fmtDuration(stats.totalMinutes)}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={
                        rank === 1
                          ? "h-full rounded-full bg-gradient-to-r from-amber to-amber-ink/80"
                          : rank === 2
                          ? "h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-500"
                          : rank === 3
                          ? "h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                          : "h-full rounded-full bg-indigo"
                      }
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>
                      {stats.sessionCount} 次 · {stats.activeDays} 天 · 日均 {fmtDuration(stats.avgDailyMinutes)}
                    </span>
                    <span className="flex items-center gap-0.5 text-ink-soft group-hover:text-indigo transition">
                      {favoriteArea?.name ?? "暂无偏好区域"}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
