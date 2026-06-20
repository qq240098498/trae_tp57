import { useState } from "react";
import { AlertTriangle, Check, Settings } from "lucide-react";
import type { BlacklistReason } from "@/data/types";
import { useStore } from "@/store/useStore";
import { yuan } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { BlacklistReasonBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const empty = { memberId: "", reason: "" as BlacklistReason, note: "" };

export function AddBlacklistModal({
  open,
  onClose,
  onOpenReasons,
}: {
  open: boolean;
  onClose: () => void;
  onOpenReasons?: () => void;
}) {
  const { members, blacklist, blacklistReasons, addBlacklist } = useStore();
  const [form, setForm] = useState({ ...empty });

  if (!open) return null;
  const blockedIds = new Set(blacklist.map((b) => b.member_id));
  const member = members.find((m) => m.id === form.memberId);
  const valid = !!form.memberId && !!form.reason && blacklistReasons.some((r) => r.id === form.reason);

  const reset = () => setForm({ ...empty });
  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const confirm = () => {
    if (!form.memberId || !form.reason) return;
    addBlacklist(form.memberId, form.reason, form.note);
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="标记黑名单"
      subtitle="风险会员再次预约需管理员确认放行"
      footer={
        <>
          {onOpenReasons && (
            <button
              onClick={() => {
                close();
                onOpenReasons();
              }}
              className="btn-ghost mr-auto !py-1.5 text-xs"
            >
              <Settings className="h-3.5 w-3.5" /> 管理原因
            </button>
          )}
          <button onClick={close} className="btn-secondary">取消</button>
          <button onClick={confirm} disabled={!valid} className="btn-primary"><Check className="h-4 w-4" /> 确认标记</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-eyebrow">会员</label>
          <select
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            className="input mt-1.5"
          >
            <option value="">请选择会员</option>
            {members.map((m) => (
              <option key={m.id} value={m.id} disabled={blockedIds.has(m.id)}>
                {m.name} · {m.phone}（余额 {yuan(m.balance)}）{blockedIds.has(m.id) ? " · 已在黑名单" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label-eyebrow">标记原因</label>
            {onOpenReasons && (
              <button
                onClick={() => {
                  close();
                  onOpenReasons();
                }}
                className="text-[11px] text-ink-muted hover:text-amber hover:underline"
              >
                新增 / 编辑原因
              </button>
            )}
          </div>
          {blacklistReasons.length === 0 ? (
            <div className="mt-1.5 rounded-xl border border-dashed border-line p-4 text-center text-xs text-ink-muted">
              暂无可选原因，请先新增至少一种原因
            </div>
          ) : (
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {blacklistReasons.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setForm({ ...form, reason: r.id })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    form.reason === r.id ? "border-amber bg-amber-soft shadow-soft" : "border-line bg-surface hover:border-amber/40",
                  )}
                >
                  <BlacklistReasonBadge reason={r.id} reasons={blacklistReasons} />
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">{r.desc || "—"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label-eyebrow">情况说明（选填）</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            placeholder="记录事件经过、处理结果等，便于后续复核"
            className="input mt-1.5 resize-none"
          />
        </div>

        {member && (
          <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber-soft p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-xs leading-relaxed text-amber-ink">
              标记后，<span className="font-semibold">{member.name}</span> 再次发起预约时，系统将拦截并弹窗提示管理员确认是否放行；不确认放行则无法完成预约。
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
