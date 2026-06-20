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
  ReservationInput,
  SpaceStatus,
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
  toasts: Toast[];
}

export interface CreateResult {
  ok: boolean;
  error?: string;
  reservation?: Reservation;
  blocked?: boolean;
  blacklist?: BlacklistEntry;
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

interface Actions {
  createReservation: (input: ReservationInput, opts?: { force?: boolean }) => CreateResult;
  cancelReservation: (id: string) => void;
  checkIn: (reservationId: string) => CreateResult;
  checkOut: (reservationId: string) => CreateResult;
  updateSpaceStatus: (id: string, status: SpaceStatus) => void;
  updateAreaPricing: (areaId: string, patch: Partial<Pick<Area, "price_hourly" | "price_day" | "price_month" | "price_times">>) => void;
  addBlacklist: (memberId: string, reason: BlacklistReason, note: string) => void;
  removeBlacklist: (id: string) => void;
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
        const { spaces, areas, reservations, members, blacklist } = get();
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

        if (overtimeBills.length) {
          get().pushToast({ type: "info", title: "签退成功 · 含超时补费", desc: `超时补费 ¥${overtimeBills[0].amount}` });
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
      }),
    },
  ),
);
