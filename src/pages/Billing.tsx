import { useMemo } from "react";
import { Wallet, CalendarDays, Receipt, Gauge } from "lucide-react";
import { useStore } from "@/store/useStore";
import { revenueByArea, revenueByPlan } from "@/store/selectors";
import { RevenueBars } from "@/components/billing/RevenueBars";
import { BillTable } from "@/components/billing/BillTable";
import { yuan } from "@/utils/format";
import { PLAN_LABEL } from "@/data/types";
import type { AreaType, Plan } from "@/data/types";

const areaTone: Record<AreaType, string> = { open: "amber", booth: "sage", room: "indigo" };
const planTone: Record<Plan, string> = { hourly: "amber", day: "sage", month: "indigo", times: "clay" };

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function Billing() {
  const { bills, reservations, spaces, areas } = useStore();
  const total = bills.reduce((a, b) => a + b.amount, 0);
  const todayRev = bills.filter((b) => isToday(b.created_at)).reduce((a, b) => a + b.amount, 0);
  const avg = bills.length ? total / bills.length : 0;

  const byArea = useMemo(() => revenueByArea(bills, reservations, spaces, areas), [bills, reservations, spaces, areas]);
  const byPlan = useMemo(() => revenueByPlan(bills, reservations), [bills, reservations]);

  const areaBars = byArea.map((x) => ({ label: x.area.name, total: x.total, tone: areaTone[x.area.type] }));
  const planBars = byPlan.map((x) => ({ label: PLAN_LABEL[x.plan], total: x.total, tone: planTone[x.plan] }));

  const stats = [
    { icon: Wallet, label: "累计营收", value: yuan(Math.round(total)), tone: "bg-amber-soft text-amber" },
    { icon: CalendarDays, label: "今日营收", value: yuan(Math.round(todayRev)), tone: "bg-sage-soft text-sage" },
    { icon: Receipt, label: "消费笔数", value: String(bills.length), tone: "bg-indigo-soft text-indigo" },
    { icon: Gauge, label: "平均客单价", value: yuan(Math.round(avg)), tone: "bg-clay-soft text-clay" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="card animate-fade-up p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 label-eyebrow">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-ink tnum">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueBars subtitle="区域维度" title="各区域营收" data={areaBars} />
        <RevenueBars subtitle="套餐维度" title="各套餐营收" data={planBars} />
      </div>

      <BillTable />
    </div>
  );
}
