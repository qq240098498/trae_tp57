import { useState } from "react";
import { Check, Plus, Pencil, Trash2, X } from "lucide-react";
import type { BlacklistReasonConfig, BlacklistTone } from "@/data/types";
import { useStore } from "@/store/useStore";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { fmtDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

type FormState = { mode: "idle" } | { mode: "add" } | { mode: "edit"; id: string };

const toneOptions: { key: BlacklistTone; label: string; cls: string }[] = [
  { key: "sage", label: "绿色（常规提醒）", cls: "bg-sage-soft text-sage-ink" },
  { key: "amber", label: "琥珀（警示）", cls: "bg-amber-soft text-amber-ink" },
  { key: "indigo", label: "靛青（中性）", cls: "bg-indigo-soft text-indigo" },
  { key: "clay", label: "暖灰（轻度违规）", cls: "bg-clay-soft text-clay" },
  { key: "rose", label: "玫红（严重）", cls: "bg-rose-100 text-rose-700" },
  { key: "neutral", label: "灰（其它）", cls: "bg-surface-sunken text-ink-soft" },
];

const emptyForm = { label: "", desc: "", tone: "amber" as BlacklistTone };

export function ManageReasonsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { blacklistReasons, blacklist, addBlacklistReason, updateBlacklistReason, removeBlacklistReason } = useStore();
  const [form, setForm] = useState({ ...emptyForm });
  const [formState, setFormState] = useState<FormState>({ mode: "idle" });

  if (!open) return null;

  const startAdd = () => {
    setForm({ ...emptyForm });
    setFormState({ mode: "add" });
  };

  const startEdit = (r: BlacklistReasonConfig) => {
    setForm({ label: r.label, desc: r.desc, tone: r.tone });
    setFormState({ mode: "edit", id: r.id });
  };

  const cancelForm = () => {
    setForm({ ...emptyForm });
    setFormState({ mode: "idle" });
  };

  const submitForm = () => {
    if (!form.label.trim()) return;
    if (formState.mode === "add") {
      addBlacklistReason(form.label, form.desc, form.tone);
    } else if (formState.mode === "edit") {
      updateBlacklistReason(formState.id, { label: form.label, desc: form.desc, tone: form.tone });
    }
    setForm({ ...emptyForm });
    setFormState({ mode: "idle" });
  };

  const valid = !!form.label.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="黑名单原因管理"
      subtitle="可自由新增、编辑、删除原因种类；正在被使用的原因不可删除"
      size="lg"
      footer={
        formState.mode === "idle" ? (
          <>
            <button onClick={onClose} className="btn-secondary">关闭</button>
            <button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> 新增原因</button>
          </>
        ) : (
          <>
            <button onClick={cancelForm} className="btn-secondary">取消</button>
            <button onClick={submitForm} disabled={!valid} className="btn-primary"><Check className="h-4 w-4" /> 保存</button>
          </>
        )
      }
    >
      {formState.mode === "idle" ? (
        <div className="space-y-2">
          {blacklistReasons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-muted">
              尚未配置任何原因种类，点击右上角「新增原因」开始添加
            </div>
          ) : (
            blacklistReasons
              .slice()
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((r) => {
                const used = blacklist.filter((b) => b.reason === r.id).length;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-line-soft bg-surface p-3.5 transition-colors hover:bg-surface-sunken/60"
                  >
                    <Badge tone={r.tone} dot>{r.label}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-soft">{r.desc || "—"}</p>
                      <p className="text-[11px] text-ink-muted">
                        已使用 {used} 条 · 创建于 {fmtDateTime(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(r)} className="btn-ghost !p-2" title="编辑">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeBlacklistReason(r.id)}
                        disabled={used > 0}
                        className={cn(
                          "btn-ghost !p-2",
                          used === 0 ? "text-clay hover:!text-rose-600" : "text-ink-muted/40",
                        )}
                        title={used > 0 ? "正在使用中，不可删除" : "删除"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm text-ink">{formState.mode === "add" ? "新增原因" : "编辑原因"}</p>
            <button onClick={cancelForm} className="btn-ghost !p-2 text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="label-eyebrow">原因名称</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="例如：噪音投诉"
              className="input mt-1.5"
              autoFocus
            />
          </div>
          <div>
            <label className="label-eyebrow">说明（选填）</label>
            <textarea
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              rows={2}
              placeholder="简单说明该类原因适用的场景"
              className="input mt-1.5 resize-none"
            />
          </div>
          <div>
            <label className="label-eyebrow">标签色调</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {toneOptions.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setForm({ ...form, tone: t.key })}
                  className={cn(
                    "rounded-lg border p-2.5 text-center text-xs transition-all",
                    form.tone === t.key ? "border-amber bg-amber-soft/60 ring-1 ring-amber/30" : "border-line bg-surface hover:border-amber/40",
                  )}
                >
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", t.cls)}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> {t.key}
                  </span>
                  <p className="mt-1.5 text-[11px] text-ink-soft">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
