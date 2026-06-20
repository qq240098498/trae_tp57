export function yuan(n: number): string {
  return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

export function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "今天";
  if (sameDay(d, tomorrow)) return "明天";
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日 ${week[d.getDay()]}`;
}

export function durationMins(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}小时` : `${h}小时${m}分`;
}

export function fmtElapsed(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const sign = diff >= 0 ? "前" : "后";
  if (abs < 60000) return "刚刚";
  if (abs < 3600000) return `${Math.round(abs / 60000)}分钟${sign}`;
  if (abs < 86400000) return `${Math.round(abs / 3600000)}小时${sign}`;
  return `${Math.round(abs / 86400000)}天${sign}`;
}

export function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysAgoAt(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function dayLabelOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
