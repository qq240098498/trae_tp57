import { useState, useEffect } from "react";
import { Crown, Plus, RefreshCw, Bell, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PermanentSeatList } from "@/components/permanent/PermanentSeatList";
import { AddPermanentSeatModal } from "@/components/permanent/AddPermanentSeatModal";
import { yuan } from "@/utils/format";
import { PERMANENT_STATUS_LABEL } from "@/data/types";

export default function PermanentSeats() {
  const permanentSeats = useStore((s) => s.permanentSeats);
  const members = useStore((s) => s.members);
  const processPermanentBilling = useStore((s) => s.processPermanentBilling);
  const checkPermanentExpirations = useStore((s) => s.checkPermanentExpirations);
  const pushToast = useStore((s) => s.pushToast);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const activeCount = permanentSeats.filter((p) => p.status === "active").length;
  const expiredCount = permanentSeats.filter((p) => p.status === "expired").length;
  const autoRenewCount = permanentSeats.filter((p) => p.auto_renew && p.status === "active").length;

  const totalMonthlyRevenue = permanentSeats
    .filter((p) => p.status === "active")
    .reduce((sum, p) => {
      const monthlyEquivalent = p.cycle === "weekly" ? p.price * 4 : p.price;
      return sum + monthlyEquivalent;
    }, 0);

  useEffect(() => {
    checkPermanentExpirations();
  }, [checkPermanentExpirations]);

  const handleProcessBilling = () => {
    processPermanentBilling();
    pushToast({ type: "success", title: "已执行自动扣费", desc: "请检查账单记录" });
  };

  const handleCheckExpirations = () => {
    checkPermanentExpirations();
  };

  const stats = [
    {
      icon: Crown,
      label: "生效中",
      value: String(activeCount),
      tone: "bg-sage-soft text-sage",
    },
    {
      icon: RefreshCw,
      label: "自动续费",
      value: String(autoRenewCount),
      tone: "bg-amber-soft text-amber",
    },
    {
      icon: AlertTriangle,
      label: "已到期",
      value: String(expiredCount),
      tone: "bg-rose-soft text-rose",
    },
    {
      icon: Bell,
      label: "月化营收",
      value: yuan(Math.round(totalMonthlyRevenue)),
      tone: "bg-indigo-soft text-indigo",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="label-eyebrow">常驻座位</p>
          <h1 className="mt-1 font-display text-2xl text-ink">长期客人固定座位管理</h1>
          <p className="mt-1 text-sm text-ink-soft">
            锁定固定座位，按周/月自动扣费，到期提醒续费
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckExpirations}
            className="btn-secondary"
          >
            <Bell className="h-4 w-4" />
            检查到期
          </button>
          <button
            onClick={handleProcessBilling}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            执行扣费
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            开通常驻
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="card animate-fade-up p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 label-eyebrow">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-ink tnum">{s.value}</p>
          </div>
        ))}
      </div>

      <PermanentSeatList />

      <AddPermanentSeatModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
