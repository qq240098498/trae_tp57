import type { Area, Plan } from "@/data/types";

export function estimateAmount(plan: Plan, area: Area, startIso: string, endIso: string): number {
  if (plan === "hourly") {
    const hours = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000;
    return +Math.max(area.price_hourly * hours, area.price_hourly * 0.5).toFixed(2);
  }
  if (plan === "day") return area.price_day;
  if (plan === "month") return area.price_month;
  return area.price_times;
}
