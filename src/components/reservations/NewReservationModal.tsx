import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, KeyRound, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import type { Plan, PayMethod, BlacklistEntry } from "@/data/types";
import { PLAN_LABEL, PAY_METHOD_LABEL, SPACE_STATUS_LABEL } from "@/data/types";
import { useStore } from "@/store/useStore";
import { estimateAmount } from "@/utils/price";
import { yuan, fmtDateTime, pad2 } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { PlanBadge, BlacklistReasonBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const plans: { key: Plan; desc: string }[] = [
  { key: "hourly", desc: "按实际时长计费" },
  { key: "day", desc: "当日有效 · 不限时段" },
  { key: "month", desc: "30 天有效 · 多次使用" },
  { key: "times", desc: "固定次数 · 单次核销" },
];

const empty = { areaId: "", spaceId: "", plan: "" as Plan | "", memberId: "", date: "", start: "", end: "", method: "balance" as PayMethod };

export function NewReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { areas, spaces, members, blacklist, createReservation, pushToast } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...empty });
  const [blockConfirm, setBlockConfirm] = useState<BlacklistEntry | null>(null);

  if (!open) return null;
  const area = areas.find((a) => a.id === form.areaId);
  const space = spaces.find((s) => s.id === form.spaceId);
  const member = members.find((m) => m.id === form.memberId);
  const memberBlock = blacklist.find((b) => b.member_id === form.memberId);
  const startIso = form.date && form.start ? new Date(`${form.date}T${form.start}:00`).toISOString() : "";
  const endIso = form.date && form.end ? new Date(`${form.date}T${form.end}:00`).toISOString() : "";
  const amount = area && form.plan ? estimateAmount(form.plan as Plan, area, startIso || new Date().toISOString(), endIso || new Date().toISOString()) : 0;

  const reset = () => {
    setForm({ ...empty });
    setStep(1);
  };
  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const stepValid = [
    !!form.spaceId,
    !!form.plan,
    !!form.memberId && !!form.date && !!form.start && !!form.end,
    true,
  ][step - 1];

  const confirm = () => {
    if (!area || !space || !form.plan || !member) return;
    const res = createReservation({
      member_id: form.memberId,
      space_id: form.spaceId,
      plan: form.plan as Plan,
      start: startIso,
      end: endIso,
      method: form.method,
    });
    if (res.ok) {
      close();
    } else if (res.blocked && res.blacklist) {
      setBlockConfirm(res.blacklist);
    } else {
      pushToast({ type: "error", title: "预约失败", desc: res.error });
    }
  };

  const forceConfirm = () => {
    if (!area || !space || !form.plan || !member) return;
    const res = createReservation(
      {
        member_id: form.memberId,
        space_id: form.spaceId,
        plan: form.plan as Plan,
        start: startIso,
        end: endIso,
        method: form.method,
      },
      { force: true },
    );
    setBlockConfirm(null);
    if (res.ok) {
      close();
    } else {
      pushToast({ type: "error", title: "预约失败", desc: res.error });
    }
  };

  const stepTitles = ["选择区域与资源", "选择套餐", "填写详情", "确认并下发门禁"];

  return (
    <>
    <Modal
      open={open}
      onClose={close}
      title="新建预约"
      subtitle={`第 ${step} 步 · ${stepTitles[step - 1]}`}
      size="lg"
      footer={
        <>
          {step > 1 && <button onClick={() => setStep(step - 1)} className="btn-secondary"><ChevronLeft className="h-4 w-4" /> 上一步</button>}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!stepValid} className="btn-primary">下一步 <ChevronRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={confirm} className="btn-primary"><Check className="h-4 w-4" /> 确认预约</button>
          )}
        </>
      }
    >
      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors", n < step ? "bg-sage text-white" : n === step ? "bg-amber text-white" : "bg-surface-sunken text-ink-muted")}>
              {n < step ? <Check className="h-3 w-3" /> : n}
            </span>
            {n < 4 && <span className={cn("h-0.5 flex-1 rounded", n < step ? "bg-sage" : "bg-line")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {areas.map((a) => (
              <button key={a.id} onClick={() => setForm({ ...form, areaId: a.id, spaceId: "" })} className={cn("rounded-xl border p-4 text-left transition-all", form.areaId === a.id ? "border-amber bg-amber-soft shadow-soft" : "border-line bg-surface hover:border-amber/40")}>
                <p className="font-display text-base text-ink">{a.name}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{a.desc}</p>
              </button>
            ))}
          </div>
          {area && (
            <div>
              <p className="mb-2 label-eyebrow">选择空闲资源 · {area.name}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {spaces.filter((s) => s.area_id === area.id).map((s) => {
                  const ok = s.status === "free";
                  return (
                    <button key={s.id} disabled={!ok} onClick={() => setForm({ ...form, spaceId: s.id })} title={SPACE_STATUS_LABEL[s.status]} className={cn("aspect-square rounded-lg border font-mono text-sm font-semibold transition-all", form.spaceId === s.id ? "border-amber bg-amber text-white shadow-soft" : ok ? "border-line bg-surface text-ink-soft hover:border-amber/40" : "cursor-not-allowed border-line-soft bg-surface-sunken text-ink-muted/40 line-through")}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && area && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const price = { hourly: area.price_hourly, day: area.price_day, month: area.price_month, times: area.price_times }[p.key];
            return (
              <button key={p.key} onClick={() => setForm({ ...form, plan: p.key })} className={cn("flex items-center justify-between rounded-xl border p-4 text-left transition-all", form.plan === p.key ? "border-amber bg-amber-soft shadow-soft" : "border-line bg-surface hover:border-amber/40")}>
                <div>
                  <p className="font-semibold text-ink">{PLAN_LABEL[p.key]}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{p.desc}</p>
                </div>
                <span className="font-display text-xl text-amber tnum">{yuan(price)}</span>
              </button>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="label-eyebrow">会员</label>
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="input mt-1.5">
              <option value="">请选择会员</option>
              {members.map((m) => {
                const blocked = blacklist.some((b) => b.member_id === m.id);
                return (
                  <option key={m.id} value={m.id}>{m.name} · {m.phone}（余额 {yuan(m.balance)}）{blocked ? " · ⚠ 黑名单" : ""}</option>
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
                <p className="mt-1.5 text-xs text-ink-muted">提交预约时将弹窗提示管理员确认是否放行</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label-eyebrow">日期</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input mt-1.5" />
            </div>
            <div>
              <label className="label-eyebrow">开始时间</label>
              <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="input mt-1.5" />
            </div>
            <div>
              <label className="label-eyebrow">结束时间</label>
              <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="input mt-1.5" />
            </div>
          </div>
          <div>
            <label className="label-eyebrow">支付方式</label>
            <div className="mt-1.5 flex gap-2">
              {(Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => (
                <button key={m} onClick={() => setForm({ ...form, method: m })} className={cn("rounded-lg border px-4 py-2 text-sm transition-all", form.method === m ? "border-amber bg-amber-soft text-amber-ink" : "border-line bg-surface text-ink-soft hover:border-amber/40")}>
                  {PAY_METHOD_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && area && space && (
        <div className="space-y-4">
          {memberBlock && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-700"><span className="font-semibold">{member?.name}</span> 为黑名单会员，确认预约后将弹窗二次确认是否放行</p>
              <BlacklistReasonBadge reason={memberBlock.reason} />
            </div>
          )}
          <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div><p className="label-eyebrow">区域</p><p className="mt-0.5 text-ink">{area.name}</p></div>
              <div><p className="label-eyebrow">资源</p><p className="mt-0.5 font-mono text-ink">{space.label}</p></div>
              <div><p className="label-eyebrow">套餐</p><p className="mt-0.5"><PlanBadge plan={form.plan as Plan} /></p></div>
              <div><p className="label-eyebrow">会员</p><p className="mt-0.5 text-ink">{member?.name}</p></div>
              <div className="col-span-2"><p className="label-eyebrow">时段</p><p className="mt-0.5 text-ink tnum">{startIso && endIso ? `${fmtDateTime(startIso)} → ${fmtDateTime(endIso)}` : "—"}</p></div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
              <span className="text-sm text-ink-soft">应付金额</span>
              <span className="font-display text-2xl text-amber tnum">{yuan(amount)}</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-sage/30 bg-sage-soft p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-sage" />
            <div className="text-sm">
              <p className="font-semibold text-sage-ink">门禁权限将自动下发</p>
              <p className="mt-0.5 text-xs text-ink-soft">预约成功后，系统将向 <span className="font-mono">{space.label}</span> 对应闸机下发开门权限（有效期 {startIso && endIso ? `${pad2(new Date(startIso).getHours())}:${pad2(new Date(startIso).getMinutes())}–${pad2(new Date(endIso).getHours())}:${pad2(new Date(endIso).getMinutes())}` : "—"}），签到可开门，签退后自动回收。</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <KeyRound className="h-3.5 w-3.5" />
            权限令牌将绑定资源 ID 与起止时段，全程记录开门日志
          </div>
        </div>
      )}
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
              <h3 className="text-lg text-ink">黑名单会员预约拦截</h3>
              <p className="mt-0.5 text-sm text-ink-soft">该会员已被标记黑名单，请确认是否放行本次预约</p>
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
              <p className="mt-2 text-[11px] text-ink-muted">标记时间 · {fmtDateTime(blockConfirm.created_at)}</p>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-xs leading-relaxed text-rose-700">确认放行后该会员可正常完成预约并下发门禁权限；拒绝则中止本次预约。如需解除标记，请前往「黑名单管理」处理。</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-line-soft px-6 py-4">
            <button onClick={() => setBlockConfirm(null)} className="btn-secondary">拒绝放行</button>
            <button onClick={forceConfirm} className="btn-primary"><ShieldCheck className="h-4 w-4" /> 确认放行</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
