import { useState } from "react";
import { Crown, RefreshCw, XCircle, Bell, DollarSign } from "lucide-react";
import type { PermanentSeatStatus, PayMethod } from "@/data/types";
import { PERMANENT_STATUS_LABEL, PERMANENT_CYCLE_LABEL, PAY_METHOD_LABEL } from "@/data/types";
import { useStore } from "@/store/useStore";
import { yuan, fmtDate, relativeTime } from "@/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const statusTone: Record<PermanentSeatStatus, "sage" | "rose" | "neutral"> = {
  active: "sage",
  expired: "rose",
  cancelled: "neutral",
};

export function PermanentSeatList() {
  const {
    permanentSeats,
    members,
    spaces,
    areas,
    cancelPermanentSeat,
    renewPermanentSeat,
    toggleAutoRenew,
    pushToast,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<"all" | PermanentSeatStatus>("all");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [confirmRenew, setConfirmRenew] = useState<string | null>(null);
  const [renewMethod, setRenewMethod] = useState<PayMethod>("balance");

  const filtered = permanentSeats.filter(
    (p) => statusFilter === "all" || p.status === statusFilter,
  );

  const getDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const handleCancel = (id: string) => {
    cancelPermanentSeat(id);
    setConfirmCancel(null);
  };

  const handleRenew = (id: string) => {
    const res = renewPermanentSeat(id, renewMethod);
    if (res.ok) {
      setConfirmRenew(null);
    } else {
      pushToast({ type: "error", title: "续期失败", desc: res.error });
    }
  };

  const ps = confirmRenew ? permanentSeats.find((p) => p.id === confirmRenew) : null;
  const psMember = ps ? members.find((m) => m.id === ps.member_id) : null;
  const psSpace = ps ? spaces.find((s) => s.id === ps.space_id) : null;
  const psArea = ps && psSpace ? areas.find((a) => a.id === psSpace.area_id) : null;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3.5">
        <span className="label-eyebrow">常驻座位列表</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
          {[
            { key: "all", label: "全部" },
            { key: "active", label: "生效中" },
            { key: "expired", label: "已到期" },
            { key: "cancelled", label: "已取消" },
          ].map((k) => (
            <button
              key={k.key}
              onClick={() => setStatusFilter(k.key as typeof statusFilter)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === k.key
                  ? "bg-amber-soft text-amber-ink"
                  : "text-ink-soft hover:bg-surface-sunken",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line-soft/60">
        {filtered.map((seat) => {
          const member = members.find((m) => m.id === seat.member_id);
          const space = spaces.find((s) => s.id === seat.space_id);
          const area = space ? areas.find((a) => a.id === space.area_id) : null;
          const daysLeft = getDaysLeft(seat.end_date);
          const isExpiringSoon = seat.status === "active" && daysLeft <= 3 && daysLeft > 0;

          return (
            <div key={seat.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-soft text-rose">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-ink">
                      {space?.label ?? "—"}
                    </span>
                    <Badge tone={statusTone[seat.status]} dot>
                      {PERMANENT_STATUS_LABEL[seat.status]}
                    </Badge>
                    {isExpiringSoon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-medium text-amber-ink">
                        <Bell className="h-3 w-3" />
                        {daysLeft}天后到期
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {area?.name} · {member?.name ?? "未知会员"}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {member?.phone ?? ""}
                  </p>
                </div>
              </div>

              <div className="ml-0 grid flex-1 grid-cols-3 gap-4 sm:ml-4">
                <div>
                  <p className="text-[11px] text-ink-muted">计费周期</p>
                  <p className="mt-0.5 text-sm text-ink">
                    {PERMANENT_CYCLE_LABEL[seat.cycle]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted">费用 / 周期</p>
                  <p className="mt-0.5 text-sm font-semibold text-amber tnum">
                    {yuan(seat.price)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted">到期时间</p>
                  <p className="mt-0.5 text-sm text-ink tnum">
                    {fmtDate(seat.end_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:ml-4">
                {seat.auto_renew && seat.status === "active" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-medium text-sage">
                    <RefreshCw className="h-3 w-3" />
                    自动续费
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                {seat.status === "active" && (
                  <>
                    <button
                      onClick={() => {
                        setConfirmRenew(seat.id);
                        setRenewMethod("balance");
                      }}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      续费
                    </button>
                    <button
                      onClick={() => toggleAutoRenew(seat.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs transition-all",
                        seat.auto_renew
                          ? "border-sage/30 bg-sage-soft text-sage"
                          : "border-line bg-surface text-ink-soft hover:border-amber/40",
                      )}
                    >
                      <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
                      {seat.auto_renew ? "关闭自动" : "开启自动"}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(seat.id)}
                      className="rounded-lg border border-rose/20 bg-rose-soft/50 px-3 py-1.5 text-xs text-rose transition-all hover:bg-rose-soft"
                    >
                      <XCircle className="mr-1 inline h-3.5 w-3.5" />
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-muted">
            暂无常驻座位记录
          </div>
        )}
      </div>

      <div className="px-5 py-3 text-xs text-ink-muted">
        共 {filtered.length} 条记录
      </div>

      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="取消常驻座位"
        subtitle="取消后座位将自动释放"
        size="md"
        footer={
          <>
            <button onClick={() => setConfirmCancel(null)} className="btn-secondary">
              返回
            </button>
            <button
              onClick={() => confirmCancel && handleCancel(confirmCancel)}
              className="btn-primary !bg-rose !text-white hover:!bg-rose/90"
            >
              确认取消
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            确定要取消该常驻座位吗？取消后座位将恢复为空闲状态，可被其他会员预约。
          </p>
          <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
            <p className="text-xs text-ink-muted">
              注意：已支付的费用不予退还，请谨慎操作。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmRenew}
        onClose={() => setConfirmRenew(null)}
        title="续期常驻座位"
        subtitle={`续期一个${ps?.cycle === "weekly" ? "周" : "月"}`}
        size="md"
        footer={
          <>
            <button onClick={() => setConfirmRenew(null)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={() => confirmRenew && handleRenew(confirmRenew)}
              className="btn-primary"
            >
              确认续费
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="label-eyebrow">会员</p>
                <p className="mt-0.5 text-ink">{psMember?.name ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">座位</p>
                <p className="mt-0.5 font-mono text-ink">{psSpace?.label ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">区域</p>
                <p className="mt-0.5 text-ink">{psArea?.name ?? "—"}</p>
              </div>
              <div>
                <p className="label-eyebrow">周期</p>
                <p className="mt-0.5 text-ink">
                  {ps ? PERMANENT_CYCLE_LABEL[ps.cycle] : "—"}
                </p>
              </div>
              <div>
                <p className="label-eyebrow">当前到期</p>
                <p className="mt-0.5 text-ink tnum">
                  {ps ? fmtDate(ps.end_date) : "—"}
                </p>
              </div>
              <div>
                <p className="label-eyebrow">续期费用</p>
                <p className="mt-0.5 font-semibold text-amber tnum">
                  {ps ? yuan(ps.price) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="label-eyebrow">支付方式</label>
            <div className="mt-1.5 flex gap-2">
              {(Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setRenewMethod(m)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-all",
                    renewMethod === m
                      ? "border-amber bg-amber-soft text-amber-ink"
                      : "border-line bg-surface text-ink-soft hover:border-amber/40",
                  )}
                >
                  {PAY_METHOD_LABEL[m]}
                  {m === "balance" && psMember && (
                    <span className="ml-1 text-xs opacity-70">
                      （{yuan(psMember.balance)}）
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
