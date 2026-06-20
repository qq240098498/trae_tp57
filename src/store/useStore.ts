import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Area,
  Space,
  Member,
  Reservation,
  AccessToken,
  Attendance,
  Bill,
  AccessLog,
  BlacklistEntry,
  BlacklistReason,
  BlacklistReasonConfig,
  BlacklistTone,
  ReservationInput,
  SpaceStatus,
  PermanentSeat,
  PermanentBillingCycle,
  PayMethod,
  PrintItem,
  SnackItem,
} from "@/data/types";
import { seedData } from "@/data/seed";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  desc?: string;
}

interface State {
  areas: Area[];
  spaces: Space[];
  members: Member[];
  reservations: Reservation[];
  accessTokens: AccessToken[];
  attendance: Attendance[];
  bills: Bill[];
  accessLogs: AccessLog[];
  blacklist: BlacklistEntry[];
  blacklistReasons: BlacklistReasonConfig[];
  permanentSeats: PermanentSeat[];
  printItems: PrintItem[];
  snackItems: SnackItem[];
  toasts: Toast[];
}

export interface CreateResult {
  ok: boolean;
  error?: string;
  reservation?: Reservation;
  blocked?: boolean;
  blacklist?: BlacklistEntry;
  permanentSeat?: PermanentSeat;
}

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function planAmount(plan: Reservation["plan"], area: Area, startIso: string, endIso: string): number {
  if (plan === "hourly") {
    const hours = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000;
    return +Math.max(area.price_hourly * hours, area.price_hourly * 0.5).toFixed(2);
  }
  if (plan === "day") return area.price_day;
  if (plan === "month") return area.price_month;
  return area.price_times;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

interface Actions {
  createReservation: (input: ReservationInput, opts?: { force?: boolean }) => CreateResult;
  cancelReservation: (id: string) => void;
  checkIn: (reservationId: string) => CreateResult;
  checkOut: (reservationId: string) => CreateResult;
  updateSpaceStatus: (id: string, status: SpaceStatus) => void;
  updateAreaPricing: (areaId: string, patch: Partial<Pick<Area, "price_hourly" | "price_day" | "price_month" | "price_times">>) => void;
  addBlacklist: (memberId: string, reason: BlacklistReason, note: string) => void;
  removeBlacklist: (id: string) => void;
  addBlacklistReason: (label: string, desc: string, tone: BlacklistTone) => void;
  updateBlacklistReason: (id: string, patch: Partial<Pick<BlacklistReasonConfig, "label" | "desc" | "tone">>) => void;
  removeBlacklistReason: (id: string) => void;
  createPermanentSeat: (input: {
    member_id: string;
    space_id: string;
    cycle: PermanentBillingCycle;
    start_date: string;
    end_date: string;
    price: number;
    auto_renew?: boolean;
    method: PayMethod;
    note?: string;
  }) => CreateResult;
  cancelPermanentSeat: (id: string) => void;
  renewPermanentSeat: (id: string, method: PayMethod) => CreateResult;
  toggleAutoRenew: (id: string) => void;
  processPermanentBilling: () => { billed: number; cycles: number };
  checkPermanentExpirations: () => void;
  addPrintCharge: (reservationId: string, printItemId: string, sheets: number) => CreateResult;
  addSnackCharge: (reservationId: string, items: { snackItemId: string; quantity: number }[]) => CreateResult;
  resetData: () => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...seedData,
      toasts: [],

      createReservation: (input, opts) => {
        const { spaces, areas, reservations, members, blacklist, permanentSeats } = get();
        const space = spaces.find((s) => s.id === input.space_id);
        if (!space) return { ok: false, error: "资源不存在" };
        if (space.status === "maintenance") return { ok: false, error: "该资源维护中，暂不可预约" };
        const area = areas.find((a) => a.id === space.area_id)!;
        const member = members.find((m) => m.id === input.member_id);
        if (!member) return { ok: false, error: "会员不存在" };

        if (!opts?.force) {
          const block = blacklist.find((b) => b.member_id === input.member_id);
          if (block) return { ok: false, blocked: true, blacklist: block };
        }

        const permanentSeat = permanentSeats.find(
          (p) => p.space_id === input.space_id && p.status === "active",
        );
        if (permanentSeat && permanentSeat.member_id !== input.member_id) {
          return { ok: false, error: "该座位为常驻座位，不可预约" };
        }

        if (new Date(input.start) >= new Date(input.end)) {
          return { ok: false, error: "结束时间需晚于开始时间" };
        }
        const conflict = reservations.some(
          (r) =>
            r.space_id === input.space_id &&
            r.status !== "cancelled" &&
            r.status !== "done" &&
            overlap(r.start, r.end, input.start, input.end),
        );
        if (conflict) return { ok: false, error: "该资源在所选时段已被预约" };

        const amount = planAmount(input.plan, area, input.start, input.end);
        const id = uid("R");
        const ts = now();
        const reservation: Reservation = {
          id,
          member_id: input.member_id,
          space_id: input.space_id,
          plan: input.plan,
          start: input.start,
          end: input.end,
          status: "pending",
          amount,
          created_at: ts,
        };

        const tokenId = uid("T");
        const token: AccessToken = {
          id: tokenId,
          reservation_id: id,
          space_id: input.space_id,
          valid_from: input.start,
          valid_to: input.end,
          status: "issued",
        };
        const issueLog: AccessLog = {
          id: uid("L"),
          token_id: tokenId,
          space_id: input.space_id,
          time: ts,
          action: "issue",
          result: "success",
        };
        const bill: Bill = {
          id: uid("B"),
          reservation_id: id,
          member_id: input.member_id,
          amount,
          method: input.method,
          kind: "reservation",
          created_at: ts,
        };

        set((st) => ({
          reservations: [reservation, ...st.reservations],
          accessTokens: [token, ...st.accessTokens],
          accessLogs: [issueLog, ...st.accessLogs],
          bills: [bill, ...st.bills],
          spaces: st.spaces.map((s) =>
            s.id === input.space_id && s.status === "free" ? { ...s, status: "reserved" } : s,
          ),
          members: input.method === "balance"
            ? st.members.map((m) => (m.id === input.member_id ? { ...m, balance: m.balance - amount } : m))
            : st.members,
        }));

        get().pushToast({ type: "success", title: opts?.force ? "预约成功 · 管理员放行" : "预约成功", desc: `门禁权限已自动下发 · ${area.name} ${space.label}` });
        return { ok: true, reservation };
      },

      cancelReservation: (id) => {
        const r = get().reservations.find((x) => x.id === id);
        if (!r) return;
        set((st) => ({
          reservations: st.reservations.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)),
          accessTokens: st.accessTokens.map((t) =>
            t.reservation_id === id && t.status === "issued" ? { ...t, status: "revoked" } : t,
          ),
          accessLogs: [
            { id: uid("L"), token_id: st.accessTokens.find((t) => t.reservation_id === id)?.id ?? "", space_id: r.space_id, time: now(), action: "revoke", result: "success" },
            ...st.accessLogs,
          ],
          spaces: st.spaces.map((s) => (s.id === r.space_id && s.status === "reserved" ? { ...s, status: "free" } : s)),
        }));
        get().pushToast({ type: "info", title: "预约已取消", desc: "门禁权限已回收" });
      },

      checkIn: (reservationId) => {
        const r = get().reservations.find((x) => x.id === reservationId);
        if (!r) return { ok: false, error: "预约不存在" };
        if (r.status !== "pending") return { ok: false, error: "当前状态不可签到" };
        const ts = now();
        const token = get().accessTokens.find((t) => t.reservation_id === reservationId);
        set((st) => ({
          reservations: st.reservations.map((x) => (x.id === reservationId ? { ...x, status: "active" } : x)),
          attendance: [{ id: uid("AT"), reservation_id: reservationId, check_in: ts }, ...st.attendance],
          spaces: st.spaces.map((s) => (s.id === r.space_id ? { ...s, status: "occupied" } : s)),
          accessLogs: token
            ? [{ id: uid("L"), token_id: token.id, space_id: r.space_id, time: ts, action: "open", result: "success" }, ...st.accessLogs]
            : st.accessLogs,
        }));
        get().pushToast({ type: "success", title: "签到成功", desc: "门禁已开启，祝学习愉快" });
        return { ok: true };
      },

      checkOut: (reservationId) => {
        const r = get().reservations.find((x) => x.id === reservationId);
        if (!r) return { ok: false, error: "预约不存在" };
        if (r.status !== "active") return { ok: false, error: "当前状态不可签退" };
        const ts = now();
        const space = get().spaces.find((s) => s.id === r.space_id);
        const area = space ? get().areas.find((a) => a.id === space.area_id) : undefined;
        const token = get().accessTokens.find((t) => t.reservation_id === reservationId);

        const overtimeMs = Math.max(0, new Date(ts).getTime() - new Date(r.end).getTime());
        const overtimeBills: Bill[] = [];
        if (overtimeMs > 60000 && area) {
          const hours = overtimeMs / 3600000;
          const extra = +(area.price_hourly * hours).toFixed(2);
          overtimeBills.push({
            id: uid("B"),
            reservation_id: reservationId,
            member_id: r.member_id,
            amount: extra,
            method: "balance",
            kind: "overtime",
            created_at: ts,
          });
        }

        const sessionBills = get().bills.filter((b) => b.reservation_id === reservationId);
        const printTotal = sessionBills.filter((b) => b.kind === "print").reduce((s, b) => s + b.amount, 0);
        const snackTotal = sessionBills.filter((b) => b.kind === "snack").reduce((s, b) => s + b.amount, 0);
        const overtimeTotal = overtimeBills.reduce((s, b) => s + b.amount, 0);
        const totalExtra = +(printTotal + snackTotal + overtimeTotal).toFixed(2);

        set((st) => ({
          reservations: st.reservations.map((x) => (x.id === reservationId ? { ...x, status: "done" } : x)),
          attendance: st.attendance.map((a) =>
            a.reservation_id === reservationId && !a.check_out ? { ...a, check_out: ts } : a,
          ),
          accessTokens: st.accessTokens.map((t) =>
            t.reservation_id === reservationId && t.status === "issued" ? { ...t, status: "revoked" } : t,
          ),
          bills: [...overtimeBills, ...st.bills],
          members: overtimeBills.length
            ? st.members.map((m) => (m.id === r.member_id ? { ...m, balance: m.balance - overtimeBills[0].amount } : m))
            : st.members,
          spaces: st.spaces.map((s) => (s.id === r.space_id ? { ...s, status: "free" } : s)),
          accessLogs: token
            ? [{ id: uid("L"), token_id: token.id, space_id: r.space_id, time: ts, action: "revoke", result: "success" }, ...st.accessLogs]
            : st.accessLogs,
        }));

        const parts: string[] = [];
        if (printTotal > 0) parts.push(`打印 ¥${printTotal}`);
        if (snackTotal > 0) parts.push(`商品 ¥${snackTotal}`);
        if (overtimeTotal > 0) parts.push(`超时 ¥${overtimeTotal.toFixed(2)}`);

        if (parts.length > 0) {
          get().pushToast({
            type: "info",
            title: "签退成功 · 合并结算",
            desc: `${parts.join(" · ")} · 合计 ¥${totalExtra.toFixed(2)}`,
          });
        } else {
          get().pushToast({ type: "success", title: "签退成功", desc: "门禁权限已回收" });
        }
        return { ok: true };
      },

      updateSpaceStatus: (id, status) => {
        set((st) => ({ spaces: st.spaces.map((s) => (s.id === id ? { ...s, status } : s)) }));
      },

      updateAreaPricing: (areaId, patch) => {
        set((st) => ({ areas: st.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)) }));
        get().pushToast({ type: "success", title: "定价已更新" });
      },

      addBlacklist: (memberId, reason, note) => {
        const exists = get().blacklist.some((b) => b.member_id === memberId);
        if (exists) {
          get().pushToast({ type: "error", title: "已存在黑名单记录", desc: "该会员已在黑名单中" });
          return;
        }
        const validReason = get().blacklistReasons.some((r) => r.id === reason);
        if (!validReason) {
          get().pushToast({ type: "error", title: "原因不存在", desc: "请从有效原因中选择" });
          return;
        }
        const member = get().members.find((m) => m.id === memberId);
        const entry: BlacklistEntry = {
          id: uid("BL"),
          member_id: memberId,
          reason,
          note: note.trim(),
          created_at: now(),
        };
        set((st) => ({ blacklist: [entry, ...st.blacklist] }));
        get().pushToast({ type: "info", title: "已标记黑名单", desc: `${member?.name ?? memberId} · 再次预约需管理员确认放行` });
      },

      removeBlacklist: (id) => {
        const entry = get().blacklist.find((b) => b.id === id);
        if (!entry) return;
        const member = get().members.find((m) => m.id === entry.member_id);
        set((st) => ({ blacklist: st.blacklist.filter((b) => b.id !== id) }));
        get().pushToast({ type: "success", title: "已移出黑名单", desc: `${member?.name ?? entry.member_id} 恢复正常预约` });
      },

      addBlacklistReason: (label, desc, tone) => {
        const trimmed = label.trim();
        if (!trimmed) {
          get().pushToast({ type: "error", title: "名称不能为空" });
          return;
        }
        const dup = get().blacklistReasons.some((r) => r.label === trimmed);
        if (dup) {
          get().pushToast({ type: "error", title: "原因名称已存在", desc: "请使用不同的名称" });
          return;
        }
        const reason: BlacklistReasonConfig = {
          id: uid("reason"),
          label: trimmed,
          desc: desc.trim(),
          tone,
          created_at: now(),
        };
        set((st) => ({ blacklistReasons: [...st.blacklistReasons, reason] }));
        get().pushToast({ type: "success", title: "已新增原因", desc: `${trimmed}` });
      },

      updateBlacklistReason: (id, patch) => {
        const original = get().blacklistReasons.find((r) => r.id === id);
        if (!original) return;
        if (patch.label) {
          const trimmed = patch.label.trim();
          if (!trimmed) {
            get().pushToast({ type: "error", title: "名称不能为空" });
            return;
          }
          const dup = get().blacklistReasons.some((r) => r.id !== id && r.label === trimmed);
          if (dup) {
            get().pushToast({ type: "error", title: "原因名称已存在", desc: "请使用不同的名称" });
            return;
          }
          patch = { ...patch, label: trimmed };
        }
        if (patch.desc) patch = { ...patch, desc: patch.desc.trim() };
        set((st) => ({
          blacklistReasons: st.blacklistReasons.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        get().pushToast({ type: "success", title: "原因配置已更新" });
      },

      removeBlacklistReason: (id) => {
        const reason = get().blacklistReasons.find((r) => r.id === id);
        if (!reason) return;
        const usedCount = get().blacklist.filter((b) => b.reason === id).length;
        if (usedCount > 0) {
          get().pushToast({
            type: "error",
            title: "原因正在使用中",
            desc: `已有 ${usedCount} 条黑名单记录使用该原因，无法删除`,
          });
          return;
        }
        if (get().blacklistReasons.length <= 1) {
          get().pushToast({ type: "error", title: "至少保留一个原因", desc: "请先新增其它原因后再删除" });
          return;
        }
        set((st) => ({ blacklistReasons: st.blacklistReasons.filter((r) => r.id !== id) }));
        get().pushToast({ type: "success", title: "原因已删除", desc: reason.label });
      },

      createPermanentSeat: (input) => {
        const { spaces, areas, members, permanentSeats, blacklist } = get();
        const space = spaces.find((s) => s.id === input.space_id);
        if (!space) return { ok: false, error: "资源不存在" };
        if (space.status === "maintenance") return { ok: false, error: "该资源维护中，不可设为常驻" };
        const area = areas.find((a) => a.id === space.area_id)!;
        const member = members.find((m) => m.id === input.member_id);
        if (!member) return { ok: false, error: "会员不存在" };

        const blocked = blacklist.find((b) => b.member_id === input.member_id);
        if (blocked) return { ok: false, blocked: true, blacklist: blocked };

        const existingActive = permanentSeats.find(
          (p) => p.space_id === input.space_id && p.status === "active",
        );
        if (existingActive) return { ok: false, error: "该座位已有有效常驻合同" };

        const memberActive = permanentSeats.find(
          (p) => p.member_id === input.member_id && p.status === "active",
        );
        if (memberActive) return { ok: false, error: "该会员已有有效常驻座位" };

        if (new Date(input.start_date) >= new Date(input.end_date)) {
          return { ok: false, error: "结束日期需晚于开始日期" };
        }

        if (input.method === "balance" && member.balance < input.price) {
          return { ok: false, error: "余额不足" };
        }

        const ts = now();
        const id = uid("PS");
        const permanentSeat: PermanentSeat = {
          id,
          member_id: input.member_id,
          space_id: input.space_id,
          cycle: input.cycle,
          price: input.price,
          start_date: input.start_date,
          end_date: input.end_date,
          status: "active",
          auto_renew: input.auto_renew ?? false,
          last_billed_at: ts,
          created_at: ts,
          note: input.note?.trim(),
        };

        const bill: Bill = {
          id: uid("B"),
          reservation_id: "",
          member_id: input.member_id,
          amount: input.price,
          method: input.method,
          kind: "reservation",
          created_at: ts,
        };

        set((st) => ({
          permanentSeats: [permanentSeat, ...st.permanentSeats],
          bills: [bill, ...st.bills],
          spaces: st.spaces.map((s) =>
            s.id === input.space_id && s.status === "free" ? { ...s, status: "occupied" } : s,
          ),
          members: input.method === "balance"
            ? st.members.map((m) => (m.id === input.member_id ? { ...m, balance: m.balance - input.price } : m))
            : st.members,
        }));

        get().pushToast({
          type: "success",
          title: "常驻座位已开通",
          desc: `${member.name} · ${area.name} ${space.label} · ${input.cycle === "weekly" ? "按周" : "按月"}`,
        });
        return { ok: true, permanentSeat };
      },

      cancelPermanentSeat: (id) => {
        const ps = get().permanentSeats.find((p) => p.id === id);
        if (!ps) return;
        const member = get().members.find((m) => m.id === ps.member_id);
        const space = get().spaces.find((s) => s.id === ps.space_id);
        set((st) => ({
          permanentSeats: st.permanentSeats.map((p) => (p.id === id ? { ...p, status: "cancelled" } : p)),
          spaces: st.spaces.map((s) =>
            s.id === ps.space_id && s.status === "occupied" ? { ...s, status: "free" } : s,
          ),
        }));
        get().pushToast({
          type: "info",
          title: "常驻座位已取消",
          desc: `${member?.name ?? ps.member_id} · ${space?.label ?? ps.space_id}`,
        });
      },

      renewPermanentSeat: (id, method) => {
        const ps = get().permanentSeats.find((p) => p.id === id);
        if (!ps) return { ok: false, error: "常驻合同不存在" };
        const member = get().members.find((m) => m.id === ps.member_id);
        if (!member) return { ok: false, error: "会员不存在" };

        if (method === "balance" && member.balance < ps.price) {
          return { ok: false, error: "余额不足" };
        }

        const ts = now();
        const newEndDate = ps.cycle === "weekly" ? addDays(ps.end_date, 7) : addMonths(ps.end_date, 1);

        const bill: Bill = {
          id: uid("B"),
          reservation_id: "",
          member_id: ps.member_id,
          amount: ps.price,
          method,
          kind: "reservation",
          created_at: ts,
        };

        set((st) => ({
          permanentSeats: st.permanentSeats.map((p) =>
            p.id === id ? { ...p, end_date: newEndDate, status: "active", last_billed_at: ts } : p,
          ),
          bills: [bill, ...st.bills],
          members: method === "balance"
            ? st.members.map((m) => (m.id === ps.member_id ? { ...m, balance: m.balance - ps.price } : m))
            : st.members,
        }));

        get().pushToast({
          type: "success",
          title: "续期成功",
          desc: `已续期至 ${new Date(newEndDate).toLocaleDateString("zh-CN")}`,
        });
        return { ok: true };
      },

      toggleAutoRenew: (id) => {
        const ps = get().permanentSeats.find((p) => p.id === id);
        if (!ps) return;
        set((st) => ({
          permanentSeats: st.permanentSeats.map((p) =>
            p.id === id ? { ...p, auto_renew: !p.auto_renew } : p,
          ),
        }));
        get().pushToast({
          type: "info",
          title: ps.auto_renew ? "已关闭自动续费" : "已开启自动续费",
        });
      },

      processPermanentBilling: () => {
        const { permanentSeats, members } = get();
        const nowTime = new Date().getTime();
        const billedSeats: { seat: PermanentSeat; cycles: number }[] = [];

        const updatedSeats = permanentSeats.map((ps) => {
          if (ps.status !== "active" || !ps.auto_renew) return ps;
          if (nowTime < new Date(ps.end_date).getTime()) return ps;

          const member = members.find((m) => m.id === ps.member_id);
          if (!member) return ps;

          const maxCyclesByBalance = Math.floor(member.balance / ps.price);
          if (maxCyclesByBalance <= 0) return ps;

          let cycles = 0;
          let nextEndIso = ps.end_date;
          while (
            new Date(nextEndIso).getTime() <= nowTime &&
            cycles < maxCyclesByBalance &&
            cycles < 24
          ) {
            cycles++;
            nextEndIso = ps.cycle === "weekly" ? addDays(nextEndIso, 7) : addMonths(nextEndIso, 1);
          }
          if (cycles === 0) return ps;

          billedSeats.push({ seat: ps, cycles });
          return { ...ps, end_date: nextEndIso, last_billed_at: new Date(nowTime).toISOString() };
        });

        if (billedSeats.length === 0) return { billed: 0, cycles: 0 };

        const deductByMember = new Map<string, number>();
        const newBills: Bill[] = billedSeats.map(({ seat, cycles }) => {
          const total = +(seat.price * cycles).toFixed(2);
          deductByMember.set(seat.member_id, (deductByMember.get(seat.member_id) ?? 0) + total);
          return {
            id: uid("B"),
            reservation_id: "",
            member_id: seat.member_id,
            amount: total,
            method: "balance" as PayMethod,
            kind: "reservation" as const,
            created_at: now(),
          };
        });

        const updatedMembers = members.map((m) => {
          const deduct = deductByMember.get(m.id);
          return deduct ? { ...m, balance: +(m.balance - deduct).toFixed(2) } : m;
        });

        set((st) => ({
          permanentSeats: updatedSeats,
          bills: [...newBills, ...st.bills],
          members: updatedMembers,
        }));

        const totalCycles = billedSeats.reduce((s, b) => s + b.cycles, 0);
        return { billed: billedSeats.length, cycles: totalCycles };
      },

      checkPermanentExpirations: () => {
        const { permanentSeats } = get();
        const nowTime = new Date().getTime();
        const expiring: PermanentSeat[] = [];
        const expired: PermanentSeat[] = [];

        permanentSeats.forEach((ps) => {
          if (ps.status !== "active") return;
          const endTime = new Date(ps.end_date).getTime();
          const daysLeft = Math.ceil((endTime - nowTime) / (24 * 60 * 60 * 1000));

          if (daysLeft <= 0) {
            expired.push(ps);
          } else if (daysLeft <= 3 && !ps.auto_renew) {
            expiring.push(ps);
          }
        });

        if (expired.length > 0) {
          set((st) => ({
            permanentSeats: st.permanentSeats.map((p) =>
              expired.find((e) => e.id === p.id) ? { ...p, status: "expired" } : p,
            ),
            spaces: st.spaces.map((s) => {
              const hasActive = st.permanentSeats.some(
                (p) => p.space_id === s.id && p.status === "active" && !expired.find((e) => e.id === p.id),
              );
              if (!hasActive && s.status === "occupied") {
                const hasPermanent = st.permanentSeats.some((p) => p.space_id === s.id && p.status === "active");
                return hasPermanent ? s : { ...s, status: "free" };
              }
              return s;
            }),
          }));
          get().pushToast({
            type: "error",
            title: `${expired.length} 个常驻座位已到期`,
            desc: "座位已自动释放，请及时处理",
          });
        }

        if (expiring.length > 0) {
          get().pushToast({
            type: "info",
            title: `${expiring.length} 个常驻座位即将到期`,
            desc: "请提醒会员续费或开启自动续费",
          });
        }
      },

      addPrintCharge: (reservationId, printItemId, sheets) => {
        const r = get().reservations.find((x) => x.id === reservationId);
        if (!r) return { ok: false, error: "预约不存在" };
        if (r.status !== "active") return { ok: false, error: "仅在场会员可挂账" };
        const item = get().printItems.find((p) => p.id === printItemId);
        if (!item) return { ok: false, error: "打印服务不存在" };
        if (!item.enabled) return { ok: false, error: "该打印服务已停用" };
        if (sheets <= 0) return { ok: false, error: "打印张数需大于 0" };

        const amount = +(item.price_per_sheet * sheets).toFixed(2);
        const member = get().members.find((m) => m.id === r.member_id);
        if (member && member.balance < amount) {
          return { ok: false, error: "余额不足" };
        }

        const ts = now();
        const bill: Bill = {
          id: uid("B"),
          reservation_id: reservationId,
          member_id: r.member_id,
          amount,
          method: "balance",
          kind: "print",
          created_at: ts,
          note: `${item.name} × ${sheets}张`,
        };

        set((st) => ({
          bills: [bill, ...st.bills],
          members: st.members.map((m) => (m.id === r.member_id ? { ...m, balance: +(m.balance - amount).toFixed(2) } : m)),
        }));
        get().pushToast({
          type: "success",
          title: "打印挂账成功",
          desc: `${item.name} × ${sheets}张 · ¥${amount}`,
        });
        return { ok: true };
      },

      addSnackCharge: (reservationId, items) => {
        const r = get().reservations.find((x) => x.id === reservationId);
        if (!r) return { ok: false, error: "预约不存在" };
        if (r.status !== "active") return { ok: false, error: "仅在场会员可挂账" };
        if (items.length === 0) return { ok: false, error: "请选择商品" };

        const { snackItems } = get();
        const resolved: { item: SnackItem; qty: number }[] = [];
        for (const it of items) {
          if (it.quantity <= 0) return { ok: false, error: "商品数量需大于 0" };
          const snack = snackItems.find((s) => s.id === it.snackItemId);
          if (!snack) return { ok: false, error: "商品不存在" };
          if (!snack.enabled) return { ok: false, error: `${snack.name} 已下架` };
          if (snack.stock < it.quantity) return { ok: false, error: `${snack.name} 库存不足` };
          resolved.push({ item: snack, qty: it.quantity });
        }

        const total = +resolved.reduce((s, { item, qty }) => s + item.price * qty, 0).toFixed(2);
        const member = get().members.find((m) => m.id === r.member_id);
        if (member && member.balance < total) {
          return { ok: false, error: "余额不足" };
        }

        const ts = now();
        const note = resolved.map(({ item, qty }) => `${item.name} × ${qty}`).join("、");
        const bill: Bill = {
          id: uid("B"),
          reservation_id: reservationId,
          member_id: r.member_id,
          amount: total,
          method: "balance",
          kind: "snack",
          created_at: ts,
          note,
        };

        set((st) => ({
          bills: [bill, ...st.bills],
          snackItems: st.snackItems.map((s) => {
            const match = resolved.find((r) => r.item.id === s.id);
            return match ? { ...s, stock: s.stock - match.qty } : s;
          }),
          members: st.members.map((m) => (m.id === r.member_id ? { ...m, balance: +(m.balance - total).toFixed(2) } : m)),
        }));
        get().pushToast({
          type: "success",
          title: "商品挂账成功",
          desc: `${note} · 合计 ¥${total}`,
        });
        return { ok: true };
      },

      resetData: () => {
        set({ ...seedData, toasts: [] });
        get().pushToast({ type: "info", title: "演示数据已重置" });
      },

      pushToast: (t) => {
        const id = uid("toast");
        set((st) => ({ toasts: [...st.toasts, { ...t, id }] }));
        setTimeout(() => get().dismissToast(id), 3600);
      },
      dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: "quiet-study-ops-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        areas: s.areas,
        spaces: s.spaces,
        members: s.members,
        reservations: s.reservations,
        accessTokens: s.accessTokens,
        attendance: s.attendance,
        bills: s.bills,
        accessLogs: s.accessLogs,
        blacklist: s.blacklist,
        blacklistReasons: s.blacklistReasons,
        permanentSeats: s.permanentSeats,
        printItems: s.printItems,
        snackItems: s.snackItems,
      }),
    },
  ),
);
