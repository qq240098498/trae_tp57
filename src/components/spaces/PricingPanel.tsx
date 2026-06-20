import { useState } from "react";
import { Save } from "lucide-react";
import type { Area } from "@/data/types";
import { useStore } from "@/store/useStore";
import { yuan } from "@/utils/format";
import { AreaTypeBadge } from "@/components/ui/StatusBadge";

const fields: { key: keyof Pick<Area, "price_hourly" | "price_day" | "price_month" | "price_times">; label: string; unit: string }[] = [
  { key: "price_hourly", label: "按小时", unit: "元/时" },
  { key: "price_day", label: "天卡", unit: "元/天" },
  { key: "price_month", label: "月卡", unit: "元/月" },
  { key: "price_times", label: "次卡", unit: "元/张" },
];

function PriceCard({ area }: { area: Area }) {
  const updateAreaPricing = useStore((s) => s.updateAreaPricing);
  const [vals, setVals] = useState({
    price_hourly: area.price_hourly,
    price_day: area.price_day,
    price_month: area.price_month,
    price_times: area.price_times,
  });
  const dirty = fields.some((f) => vals[f.key] !== area[f.key]);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg text-ink">{area.name}</h3>
            <AreaTypeBadge type={area.type} />
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">{area.desc}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className="rounded-lg border border-line-soft bg-surface-sunken p-3">
            <span className="label-eyebrow">{f.label}</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-sm text-ink-muted">¥</span>
              <input
                type="number"
                min={0}
                value={vals[f.key]}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: Number(e.target.value) }))}
                className="w-full bg-transparent font-display text-xl font-semibold text-ink outline-none tnum"
              />
              <span className="text-[11px] text-ink-muted">{f.unit}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-muted">天卡约折合 <span className="text-ink-soft tnum">{yuan(area.price_day / (area.price_hourly * 10))}</span> 时 / 月卡更优惠</p>
        <button
          disabled={!dirty}
          onClick={() => updateAreaPricing(area.id, vals)}
          className="btn-primary"
        >
          <Save className="h-4 w-4" /> 保存定价
        </button>
      </div>
    </div>
  );
}

export function PricingPanel() {
  const areas = useStore((s) => s.areas);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {areas.map((a) => (
        <PriceCard key={a.id} area={a} />
      ))}
    </div>
  );
}
