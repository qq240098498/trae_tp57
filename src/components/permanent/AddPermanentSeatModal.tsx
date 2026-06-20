import { useState } from "react";
import { Crown, Check, ShieldAlert } from "lucide-react";
import type { PermanentBillingCycle, PayMethod, BlacklistEntry } from "@/data/types";
import { PERMANENT_CYCLE_LABEL, PAY_METHOD_LABEL } from "@/data/types";
import { useStore } from "@/store/useStore";
import { yuan, fmtDate } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { BlacklistReasonBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const cycles: { key: PermanentBillingCycle; desc: string }[] = [
  { key: "weekly", desc: "每周自动扣费续期" },
  { key: "monthly", desc: "每月自动扣费续期" },
];

const empty = {
  memberId: "",
  spaceId: "",
  areaId: "",
  cycle: "monthly" as PermanentBillingCycle,
  startDate: "",
  endDate: "",
  price: 0,
  method: "balance" as PayMethod,
  autoRenew: true,
  note: "",
};

export function AddPermanentSeatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { areas, spaces, members, permanentSeats, blacklist, createPermanentSeat, pushToast } = useStore();
  const [form, setForm] = useState({ ...empty });
  const [blockConfirm, setBlockConfirm] = useState<BlacklistEntry | null>(null);

  if (!open) return null;

  const area = areas.find((a) => a.id === form.areaId);
  const space = spaces.find((s) => s.id === form.spaceId);
  const member = members.find((m) => m.id === form.memberId);
  const memberBlock = blacklist.find((b) => b.member_id === form.memberId);

  const availableSpaces = spaces.filter(
    (s) => s.status === "free" && !permanentSeats.some((p) => p.space_id === s.id && p.status === "active"),
  );

  const reset = () => {
    setForm({ ...empty });
    setBlockConfirm(null);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const handleAreaSelect = (areaId: string) => {
    const selectedArea = areas.find((a) => a.id === areaId);
    const defaultPrice = form.cycle === "weekly"
      ? (selectedArea?.price_month ?? 0) * 0.25
      : selectedArea?.price_month ?? 0;
    setForm({ ...form, areaId, spaceId: "", price: +defaultPrice.toFixed(2) });
  };

  const handleCycleChange = (cycle: PermanentBillingCycle) => {
    let price = form.price;
    if (area) {
      price = cycle === "weekly" ? +(area.price_month * 0.25).toFixed(2) : area.price_month;
    }
    setForm({ ...form, cycle, price });
  };

  const canSubmit = form.memberId && form.spaceId && form.startDate && form.endDate && form.price > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const startIso = new Date(form.startDate + "T08:00:00").toISOString();
    const endIso = new Date(form.endDate + "T22:00:00").toISOString();

    const res = createPermanentSeat({
      member_id: form.memberId,
      space_id: form.spaceId,
      cycle: form.cycle,
      start_date: startIso,
      end_date: endIso,
      price: form.price,
      auto_renew: form.autoRenew,
      method: form.method,
      note: form.note,
    });

    if (res.ok) {
      close();
    } else if (res.blocked && res.blacklist) {
      setBlockConfirm(res.blacklist);
    } else {
      pushToast({ type: "error", title: "开通失败", desc: res.error });
    }
  };

  const forceSubmit = () => {
    if (!canSubmit) return;

    const startIso = new Date(form.startDate + "T08:00:00").toISOString();
    const endIso = new Date(form.endDate + "T22:00:00").toISOString();

    const res = createPermanentSeat({
      member_id: form.memberId,
      space_id: form.spaceId,
      cycle: form.cycle,
      start_date: startIso,
      end_date: endIso,
      price: form.price,
      auto_renew: form.autoRenew,
      method: form.method,
      note: form.note,
    });

    setBlockConfirm(null);
    if (res.ok) {
      close();
    } else {
      pushToast({ type: "error", title: "开通失败", desc: res.error });
    }
  };

  return (
    <>
      <Modal
        open={open && !blockConfirm}
        onClose={close}
        title="开通常驻座位"
        subtitle="长期锁定固定座位，按周/月自动扣费"
        size="lg"
        footer={
          <>
            <button onClick={close} className="btn-secondary">取消</button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              <Crown className="h-4 w-4" /> 确认开通
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-eyebrow">选择区域</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {areas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAreaSelect(a.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    form.areaId === a.id
                      ? "border-amber bg-amber-soft shadow-soft"
                      : "border-line bg-surface hover:border-amber/40",
                  )}
                >
                  <p className="font-display text-sm text-ink">{a.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {area && (
            <div>
              <label className="label-eyebrow">选择座位 · {area.name}</label>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {availableSpaces
                  .filter((s) => s.area_id === area.id)
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm({ ...form, spaceId: s.id })}
                      className={cn(
                        "aspect-[4/3] rounded-lg border font-mono text-sm font-semibold transition-all",
                        form.spaceId === s.id
                          ? "border-amber bg-amber text-white shadow-soft"
                          : "border-line bg-surface text-ink-soft hover:border-amber/40",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                {availableSpaces.filter((s) => s.area_id === area.id).length === 0 && (
                  <div className="col-span-full py-6 text-center text-sm text-ink-muted">
                    该区域暂无可用空闲座位
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="label-eyebrow">计费周期</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {cycles.map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleCycleChange(c.key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    form.cycle === c.key
                      ? "border-amber bg-amber-soft shadow-soft"
                      : "border-line bg-surface hover:border-amber/40",
                  )}
                >
                  <p className="font-semibold text-ink">{PERMANENT_CYCLE_LABEL[c.key]}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-eyebrow">会员</label>
            <select
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="input mt-1.5"
            >
              <option value="">请选择会员</option>
              {members.map((m) => {
                const blocked = blacklist.some((b) => b.member_id === m.id);
                const hasPermanent = permanentSeats.some(
                  (p) => p.member_id === m.id && p.status === "active",
                );
                return (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.phone}（余额 {yuan(m.balance)}）
                    {blocked ? " · ⚠ 黑名单" : ""}
                    {hasPermanent ? " · 已有常驻" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {memberBlock && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="text-sm">
                <p className="font-semibold text-rose-700">该会员已被标记黑名单</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <BlacklistReasonBadge reason={memberBlock.reason} />
                  <span className="text-xs text-ink-soft">{memberBlock.note}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">提交时将弹窗提示管理员确认是否放行</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-eyebrow">开始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input mt-1.5"
              />
            </div>
            <div>
              <label className="label-eyebrow">结束日期</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-eyebrow">{PERMANENT_CYCLE_LABEL[form.cycle]}费用</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">¥</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: +e.target.value })}
                  className="input pl-7"
                />
              </div>
            </div>
            <div>
              <label className="label-eyebrow">支付方式</label>
              <div className="mt-1.5 flex gap-2">
                {(Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm({ ...form, method: m })}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition-all",
                      form.method === m
                        ? "border-amber bg-amber-soft text-amber-ink"
                        : "border-line bg-surface text-ink-soft hover:border-amber/40",
                    )}
                  >
                    {PAY_METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-surface-sunken p-4">
            <div>
              <p className="font-medium text-ink">自动续费</p>
              <p className="text-xs text-ink-muted">到期自动从余额扣费续期</p>
            </div>
            <button
              onClick={() => setForm({ ...form, autoRenew: !form.autoRenew })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.autoRenew ? "bg-amber" : "bg-line",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  form.autoRenew ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          <div>
            <label className="label-eyebrow">备注（选填）</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="填写备注信息..."
              className="input mt-1.5 min-h-[60px] resize-none"
            />
          </div>
        </div>
      </Modal>

      {blockConfirm && member && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setBlockConfirm(null)} />
          <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-rose-200 bg-surface shadow-lift">
            <div className="flex items-start gap-3 border-b border-rose-100 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg text-ink">黑名单会员常驻拦截</h3>
                <p className="mt-0.5 text-sm text-ink-soft">该会员已被标记黑名单，请确认是否开通常驻座位</p>
              </div>
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-base text-ink">{member.name}</p>
                  <BlacklistReasonBadge reason={blockConfirm.reason} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">{member.phone} · {member.id}</p>
              </div>
              <div>
                <p className="label-eyebrow">情况说明</p>
                <p className="mt-1 text-sm text-ink-soft">{blockConfirm.note || "无"}</p>
                <p className="mt-2 text-[11px] text-ink-muted">标记时间 · {fmtDate(blockConfirm.created_at)}</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-xs leading-relaxed text-rose-700">确认开通后该会员将获得常驻座位，座位不再对外释放，按{PERMANENT_CYCLE_LABEL[form.cycle]}自动扣费。</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-line-soft px-6 py-4">
              <button onClick={() => setBlockConfirm(null)} className="btn-secondary">取消</button>
              <button onClick={forceSubmit} className="btn-primary">
                <Check className="h-4 w-4" /> 确认开通
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
