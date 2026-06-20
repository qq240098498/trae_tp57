import type {
  Area,
  Space,
  Member,
  Reservation,
  Bill,
  AccessToken,
  Attendance,
  AccessLog,
  BlacklistEntry,
} from "@/data/types";
import { durationMins } from "@/utils/format";

export interface SpaceArea {
  space: Space;
  area: Area;
}

export function spaceArea(spaces: Space[], areas: Area[], spaceId: string): SpaceArea | undefined {
  const space = spaces.find((s) => s.id === spaceId);
  if (!space) return undefined;
  const area = areas.find((a) => a.id === space.area_id);
  if (!area) return undefined;
  return { space, area };
}

export function memberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function blacklistOfMember(blacklist: BlacklistEntry[], memberId: string): BlacklistEntry | undefined {
  return blacklist.find((b) => b.member_id === memberId);
}

export function tokenOfReservation(tokens: AccessToken[], reservationId: string): AccessToken | undefined {
  return tokens.find((t) => t.reservation_id === reservationId);
}

export function attendanceOf(att: Attendance[], reservationId: string): Attendance | undefined {
  return att.find((a) => a.reservation_id === reservationId);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function todayReservations(reservations: Reservation[]): Reservation[] {
  const today = new Date();
  return reservations
    .filter((r) => isSameDay(new Date(r.start), today))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function inSessionList(
  reservations: Reservation[],
  attendance: Attendance[],
  spaces: Space[],
  members: Member[],
) {
  return reservations
    .filter((r) => r.status === "active")
    .map((r) => {
      const att = attendanceOf(attendance, r.id);
      const sa = spaceArea(spaces, [], r.space_id);
      const member = memberById(members, r.member_id);
      const elapsed = att ? durationMins(att.check_in, new Date().toISOString()) : 0;
      const total = durationMins(r.start, r.end);
      return { reservation: r, attendance: att, space: sa?.space, member, elapsed, total };
    });
}

export function utilization(spaces: Space[]) {
  const total = spaces.length;
  const free = spaces.filter((s) => s.status === "free").length;
  const occupied = spaces.filter((s) => s.status === "occupied").length;
  const reserved = spaces.filter((s) => s.status === "reserved").length;
  const maintenance = spaces.filter((s) => s.status === "maintenance").length;
  const usable = total - maintenance;
  const rate = usable === 0 ? 0 : Math.round((occupied / usable) * 100);
  return { total, free, occupied, reserved, maintenance, usable, rate };
}

export function revenueLast7Days(bills: Bill[]): { label: string; total: number }[] {
  const days: { label: string; total: number; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${week[d.getDay()]}`, total: 0, date: d });
  }
  for (const b of bills) {
    const bd = new Date(b.created_at);
    for (const day of days) {
      if (isSameDay(bd, day.date)) {
        day.total += b.amount;
        break;
      }
    }
  }
  return days.map(({ label, total }) => ({ label, total: +total.toFixed(2) }));
}

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

export function revenueByArea(
  bills: Bill[],
  reservations: Reservation[],
  spaces: Space[],
  areas: Area[],
): { area: Area; total: number }[] {
  const map = new Map<string, number>();
  for (const b of bills) {
    const r = reservations.find((x) => x.id === b.reservation_id);
    if (!r) continue;
    const sa = spaceArea(spaces, areas, r.space_id);
    if (!sa) continue;
    map.set(sa.area.id, (map.get(sa.area.id) ?? 0) + b.amount);
  }
  return areas.map((a) => ({ area: a, total: +(map.get(a.id) ?? 0).toFixed(2) }));
}

export function revenueByPlan(
  bills: Bill[],
  reservations: Reservation[],
): { plan: Reservation["plan"]; total: number }[] {
  const plans: Reservation["plan"][] = ["hourly", "day", "month", "times"];
  return plans.map((plan) => {
    const total = bills
      .filter((b) => {
        const r = reservations.find((x) => x.id === b.reservation_id);
        return r?.plan === plan;
      })
      .reduce((acc, b) => acc + b.amount, 0);
    return { plan, total: +total.toFixed(2) };
  });
}

export function recentLogs(logs: AccessLog[], tokens: AccessToken[], limit = 12) {
  return [...logs]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
    .map((log) => {
      const token = tokens.find((t) => t.id === log.token_id);
      return { log, token };
    });
}
