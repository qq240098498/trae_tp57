import { useMemo } from "react";
import {
  Wallet,
  Users,
  Gauge,
  CalendarClock,
  TrendingUp,
  LayoutGrid,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import {
  todayReservations,
  utilization,
  revenueLast7Days,
  revenueByArea,
  recentLogs,
  inSessionList,
  spaceArea,
} from "@/store/selectors";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TodayTimeline } from "@/components/dashboard/TodayTimeline";
import { Badge } from "@/components/ui/Badge";
import { yuan, fmtTime, relativeTime, fmtDuration } from "@/utils/format";
import { AREA_TYPE_LABEL } from "@/data/types";

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { bills, reservations, spaces, areas, members, accessLogs, accessTokens, attendance } = useStore();

  const todayBills = bills.filter((b) => isToday(b.created_at));
  const todayRevenue = todayBills.reduce((a, b) => a + b.amount, 0);
  const today = todayReservations(reservations);
  const pending = today.filter((r) => r.status === "pending");
  const present = reservations.filter((r) => r.status === "active");
  const util = utilization(spaces);
  const rev7 = useMemo(() => revenueLast7Days(bills), [bills]);
  const byArea = useMemo(() => revenueByArea(bills, reservations, spaces, areas), [bills, reservations, spaces, areas]);
  const logs = useMemo(() => recentLogs(accessLogs, accessTokens, 6), [accessLogs, accessTokens]);
  const session = useMemo(
    () => inSessionList(reservations, attendance, spaces, members),
    [reservations, attendance, spaces, members],
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="今日营收" value={yuan(Math.round(todayRevenue))} sub={`今日 ${todayBills.length} 笔消费`} tone="amber" delay={0} />
        <StatCard icon={Users} label="在场人数" value={String(present.length)} unit="人" sub={`今日预约 ${today.length} 单`} tone="sage" delay={60} />
        <StatCard icon={Gauge} label="空间使用率" value={`${util.rate}`} unit="%" sub={`占用 ${util.occupied} / 空闲 ${util.free}`} tone="indigo" delay={120} />
        <StatCard icon={CalendarClock} label="待签到预约" value={String(pending.length)} unit="单" sub="即将到店核销" tone="clay" delay={180} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="label-eyebrow flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> 营收趋势</p>
              <h2 className="mt-1 font-display text-xl text-ink">近 7 天营收</h2>
            </div>
            <Badge tone="amber" dot>{yuan(Math.round(rev7.reduce((a, b) => a + b.total, 0)))} 合计</Badge>
          </div>
          <RevenueChart data={rev7} />
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-ink-muted" />
            <h2 className="font-display text-xl text-ink">区域概览</h2>
          </div>
          <div className="space-y-4">
            {areas.map((a) => {
              const sp = spaces.filter((s) => s.area_id === a.id);
              const occ = sp.filter((s) => s.status === "occupied").length;
              const rate = sp.length ? Math.round((occ / sp.length) * 100) : 0;
              const total = byArea.find((x) => x.area.id === a.id)?.total ?? 0;
              return (
                <div key={a.id} className="rounded-xl border border-line-soft bg-surface-sunken p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{a.name}</p>
                      <p className="text-[11px] text-ink-muted">{AREA_TYPE_LABEL[a.type]} · {sp.length} 位</p>
                    </div>
                    <span className="font-display text-lg text-amber tnum">{rate}%</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
                    <span>占用 {occ}</span>
                    <span>累计 {yuan(Math.round(total))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="label-eyebrow">今日时间轴</p>
            <h2 className="mt-1 font-display text-xl text-ink">预约时段分布</h2>
          </div>
          <button onClick={() => navigate("/reservations")} className="btn-ghost text-xs">
            查看全部 <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <TodayTimeline reservations={today} spaces={spaces} areas={areas} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">在场快览</h2>
            <button onClick={() => navigate("/attendance")} className="btn-ghost text-xs">签到签退 <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
          {session.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">暂无在场人员</p>
          ) : (
            <div className="space-y-3">
              {session.slice(0, 5).map(({ reservation, space, member, elapsed, total }) => (
                <div key={reservation.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-surface-sunken p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-soft text-xs font-semibold text-amber-ink">
                    {member?.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{member?.name} <span className="font-normal text-ink-muted">· {space?.label}</span></p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full bg-sage" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-ink tnum">{fmtDuration(elapsed)}</p>
                    <p className="text-[10px] text-ink-muted">/ {fmtDuration(total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">最近门禁记录</h2>
            <button onClick={() => navigate("/access")} className="btn-ghost text-xs">门禁联动 <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
          <div className="space-y-2.5">
            {logs.map(({ log }) => {
              const sa = spaceArea(spaces, areas, log.space_id);
              const actionLabel = { issue: "权限下发", open: "开门", revoke: "权限回收" }[log.action];
              return (
                <div key={log.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${log.result === "success" ? "bg-sage-soft text-sage" : "bg-rose-100 text-rose-600"}`}>
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{actionLabel} · {sa?.space.label ?? "—"}</p>
                    <p className="text-[11px] text-ink-muted">{relativeTime(log.time)} · {fmtTime(log.time)}</p>
                  </div>
                  <Badge tone={log.result === "success" ? "sage" : "rose"}>{log.result === "success" ? "成功" : "失败"}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
