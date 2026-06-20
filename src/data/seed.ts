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
  BlacklistReasonConfig,
  PermanentSeat,
  PrintItem,
  SnackItem,
} from "./types";
import { todayAt, daysAgoAt } from "@/utils/format";

export const seedAreas: Area[] = [
  {
    id: "area-open",
    name: "晨光开放区",
    type: "open",
    desc: "靠窗长桌 · 自然采光 · 适合自习与轻办公",
    price_hourly: 8,
    price_day: 48,
    price_month: 880,
    price_times: 120,
  },
  {
    id: "area-booth",
    name: "静音隔间区",
    type: "booth",
    desc: "独立隔间 · 屏蔽干扰 · 适合深度专注",
    price_hourly: 15,
    price_day: 88,
    price_month: 1680,
    price_times: 240,
  },
  {
    id: "area-room",
    name: "研讨室区",
    type: "room",
    desc: "双人封闭 · 白板投屏 · 适合对谈与小组研讨",
    price_hourly: 30,
    price_day: 168,
    price_month: 3200,
    price_times: 480,
  },
];

function buildSpaces(): Space[] {
  const spaces: Space[] = [];
  // 开放区 4 行 x 6 列
  const openStatus: Record<string, Space["status"]> = {
    "sp-A5": "occupied",
    "sp-A9": "reserved",
    "sp-A12": "reserved",
    "sp-A24": "maintenance",
  };
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const idx = r * 6 + c + 1;
      const id = `sp-A${idx}`;
      spaces.push({
        id,
        area_id: "area-open",
        label: `A${idx}`,
        status: openStatus[id] ?? "free",
        row: r,
        col: c,
      });
    }
  }
  // 隔间 2 行 x 4 列
  const boothStatus: Record<string, Space["status"]> = {
    "sp-B3": "occupied",
    "sp-B5": "free",
    "sp-B8": "maintenance",
  };
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c + 1;
      const id = `sp-B${idx}`;
      spaces.push({
        id,
        area_id: "area-booth",
        label: `B${idx}`,
        status: boothStatus[id] ?? "free",
        row: r,
        col: c,
      });
    }
  }
  // 研讨室 2 行 x 2 列
  const roomStatus: Record<string, Space["status"]> = {
    "sp-R2": "reserved",
    "sp-R3": "reserved",
  };
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const idx = r * 2 + c + 1;
      const id = `sp-R${idx}`;
      spaces.push({
        id,
        area_id: "area-room",
        label: `R${idx}`,
        status: roomStatus[id] ?? "free",
        row: r,
        col: c,
      });
    }
  }
  return spaces;
}

export const seedSpaces: Space[] = buildSpaces();

export const seedMembers: Member[] = [
  { id: "M01", name: "林知微", phone: "138****2046", balance: 320, joined_at: daysAgoAt(120, 10) },
  { id: "M02", name: "苏屿", phone: "139****8810", balance: 1500, joined_at: daysAgoAt(86, 14) },
  { id: "M03", name: "陈砚之", phone: "137****5521", balance: 80, joined_at: daysAgoAt(54, 9) },
  { id: "M04", name: "周以南", phone: "135****6630", balance: 560, joined_at: daysAgoAt(40, 19) },
  { id: "M05", name: "沈鹿", phone: "188****0917", balance: 2200, joined_at: daysAgoAt(31, 8) },
  { id: "M06", name: "江听潮", phone: "136****4428", balance: 40, joined_at: daysAgoAt(18, 13) },
  { id: "M07", name: "何归禾", phone: "188****7733", balance: 90, joined_at: daysAgoAt(9, 16) },
  { id: "M08", name: "顾时安", phone: "177****1192", balance: 1800, joined_at: daysAgoAt(3, 11) },
];

export const seedBlacklistReasons: BlacklistReasonConfig[] = [
  { id: "reason-noise", label: "噪音投诉", desc: "喧哗/通话等影响他人专注", tone: "amber", created_at: daysAgoAt(200, 10) },
  { id: "reason-damage", label: "损坏设施", desc: "损坏座椅、桌面等设施", tone: "clay", created_at: daysAgoAt(200, 10) },
  { id: "reason-skip", label: "逃单", desc: "未结清账单即离开", tone: "rose", created_at: daysAgoAt(200, 10) },
  { id: "reason-smell", label: "气味/卫生", desc: "饮食、异味或卫生问题严重影响他人", tone: "indigo", created_at: daysAgoAt(100, 10) },
];

export const seedBlacklist: BlacklistEntry[] = [
  { id: "BL-1001", member_id: "M03", reason: "reason-noise", note: "多次在静音隔间区大声通话，经提醒未改善", created_at: daysAgoAt(12, 15) },
  { id: "BL-1002", member_id: "M06", reason: "reason-skip", note: "上次超时未补费即离开，账单未结清", created_at: daysAgoAt(1, 21) },
  { id: "BL-1003", member_id: "M07", reason: "reason-damage", note: "损坏隔间桌面，未照价赔偿", created_at: daysAgoAt(4, 10) },
];

export const seedPermanentSeats: PermanentSeat[] = [
  {
    id: "PS-001",
    member_id: "M02",
    space_id: "sp-A3",
    cycle: "monthly",
    price: 880,
    start_date: daysAgoAt(30, 8),
    end_date: daysAgoAt(-30, 22),
    status: "active",
    auto_renew: true,
    last_billed_at: daysAgoAt(30, 9),
    created_at: daysAgoAt(30, 8),
    note: "长期固定座位，苏屿",
  },
  {
    id: "PS-002",
    member_id: "M05",
    space_id: "sp-B6",
    cycle: "weekly",
    price: 420,
    start_date: daysAgoAt(7, 8),
    end_date: daysAgoAt(-7, 22),
    status: "active",
    auto_renew: true,
    last_billed_at: daysAgoAt(7, 9),
    created_at: daysAgoAt(7, 8),
    note: "周卡固定座位，沈鹿",
  },
  {
    id: "PS-003",
    member_id: "M01",
    space_id: "sp-A15",
    cycle: "monthly",
    price: 880,
    start_date: daysAgoAt(45, 8),
    end_date: daysAgoAt(-15, 22),
    status: "active",
    auto_renew: false,
    last_billed_at: daysAgoAt(45, 9),
    created_at: daysAgoAt(45, 8),
    note: "月卡即将到期，林知微",
  },
];

interface SessionSeed {
  id: string;
  member: string;
  space: string;
  plan: Reservation["plan"];
  day: number; // 0 = today, -1 yesterday ...
  startH: number;
  endH: number;
  status: Reservation["status"];
  checkInH?: number;
  checkOutH?: number;
  overtime?: number;
}

const sessions: SessionSeed[] = [
  { id: "R-1001", member: "M01", space: "sp-A1", plan: "hourly", day: 0, startH: 8, endH: 10, status: "done", checkInH: 8, checkOutH: 10, overtime: 2 },
  { id: "R-1002", member: "M02", space: "sp-B1", plan: "hourly", day: 0, startH: 9, endH: 11, status: "done", checkInH: 9, checkOutH: 11 },
  { id: "R-1003", member: "M03", space: "sp-R1", plan: "hourly", day: 0, startH: 10, endH: 12, status: "done", checkInH: 10, checkOutH: 12 },
  { id: "R-1004", member: "M01", space: "sp-A2", plan: "times", day: 0, startH: 11, endH: 12, status: "done", checkInH: 11, checkOutH: 12 },
  { id: "R-1005", member: "M04", space: "sp-A5", plan: "hourly", day: 0, startH: 9, endH: 12, status: "active", checkInH: 9 },
  { id: "R-1006", member: "M05", space: "sp-B3", plan: "day", day: 0, startH: 8, endH: 22, status: "active", checkInH: 9 },
  { id: "R-1007", member: "M06", space: "sp-R2", plan: "hourly", day: 0, startH: 16, endH: 18, status: "pending" },
  { id: "R-1008", member: "M07", space: "sp-A9", plan: "hourly", day: 0, startH: 19, endH: 21, status: "pending" },
  { id: "R-1009", member: "M08", space: "sp-B5", plan: "hourly", day: 0, startH: 14, endH: 16, status: "cancelled" },
  { id: "R-1010", member: "M02", space: "sp-R3", plan: "month", day: 0, startH: 8, endH: 22, status: "pending" },
  // 近 6 天历史（用于营收趋势）
  { id: "R-0994", member: "M01", space: "sp-A3", plan: "hourly", day: -6, startH: 14, endH: 17, status: "done", checkInH: 14, checkOutH: 17 },
  { id: "R-0995", member: "M03", space: "sp-R2", plan: "hourly", day: -5, startH: 10, endH: 12, status: "done", checkInH: 10, checkOutH: 12 },
  { id: "R-0996", member: "M05", space: "sp-B2", plan: "day", day: -4, startH: 9, endH: 22, status: "done", checkInH: 9, checkOutH: 21 },
  { id: "R-0997", member: "M04", space: "sp-A7", plan: "times", day: -3, startH: 15, endH: 16, status: "done", checkInH: 15, checkOutH: 16 },
  { id: "R-0998", member: "M02", space: "sp-B4", plan: "hourly", day: -2, startH: 13, endH: 16, status: "done", checkInH: 13, checkOutH: 16 },
  { id: "R-0999", member: "M06", space: "sp-R4", plan: "hourly", day: -1, startH: 19, endH: 21, status: "done", checkInH: 19, checkOutH: 21, overtime: 30 },
];

function planAmount(plan: Reservation["plan"], area: Area, hours: number): number {
  switch (plan) {
    case "hourly":
      return +(area.price_hourly * hours).toFixed(2);
    case "day":
      return area.price_day;
    case "month":
      return area.price_month;
    case "times":
      return area.price_times;
  }
}

function areaOf(spaceId: string): Area {
  const sp = seedSpaces.find((s) => s.id === spaceId)!;
  return seedAreas.find((a) => a.id === sp.area_id)!;
}

const seedReservations: Reservation[] = [];
const seedAccessTokens: AccessToken[] = [];
const seedAttendance: Attendance[] = [];
const seedBills: Bill[] = [];
const seedAccessLogs: AccessLog[] = [];

let logSeq = 1;

for (const s of sessions) {
  const area = areaOf(s.space);
  const hours = Math.max(1, s.endH - s.startH);
  const amount = planAmount(s.plan, area, hours);
  const start = (s.day === 0 ? todayAt(s.startH) : daysAgoAt(-s.day, s.startH));
  const end = (s.day === 0 ? todayAt(s.endH) : daysAgoAt(-s.day, s.endH));
  const created = (s.day === 0 ? daysAgoAt(0, s.startH - 1 > 0 ? s.startH - 1 : 0) : daysAgoAt(-s.day, s.startH - 1 > 0 ? s.startH - 1 : 0));

  seedReservations.push({
    id: s.id,
    member_id: s.member,
    space_id: s.space,
    plan: s.plan,
    start,
    end,
    status: s.status,
    amount,
    created_at: created,
  });

  // 门禁令牌
  const tokenId = `T-${s.id}`;
  const tokenStatus: AccessToken["status"] =
    s.status === "cancelled" ? "revoked" : s.status === "done" ? "revoked" : "issued";
  seedAccessTokens.push({
    id: tokenId,
    reservation_id: s.id,
    space_id: s.space,
    valid_from: start,
    valid_to: end,
    status: tokenStatus,
  });
  seedAccessLogs.push({
    id: `L-${logSeq++}`,
    token_id: tokenId,
    space_id: s.space,
    time: created,
    action: "issue",
    result: "success",
  });
  if (tokenStatus === "revoked") {
    seedAccessLogs.push({
      id: `L-${logSeq++}`,
      token_id: tokenId,
      space_id: s.space,
      time: s.checkOutH != null ? (s.day === 0 ? todayAt(s.checkOutH) : daysAgoAt(-s.day, s.checkOutH)) : end,
      action: "revoke",
      result: "success",
    });
  }

  // 签到 / 签退
  if (s.checkInH != null) {
    seedAttendance.push({
      id: `AT-${s.id}`,
      reservation_id: s.id,
      check_in: s.day === 0 ? todayAt(s.checkInH) : daysAgoAt(-s.day, s.checkInH),
      check_out:
        s.checkOutH != null
          ? s.day === 0
            ? todayAt(s.checkOutH)
            : daysAgoAt(-s.day, s.checkOutH)
          : undefined,
    });
    if (s.status === "active" || s.status === "done") {
      seedAccessLogs.push({
        id: `L-${logSeq++}`,
        token_id: tokenId,
        space_id: s.space,
        time: s.day === 0 ? todayAt(s.checkInH) : daysAgoAt(-s.day, s.checkInH),
        action: "open",
        result: "success",
      });
    }
  }

  // 账单
  const billTime = s.checkInH != null ? (s.day === 0 ? todayAt(s.checkInH) : daysAgoAt(-s.day, s.checkInH)) : created;
  seedBills.push({
    id: `B-${s.id}`,
    reservation_id: s.id,
    member_id: s.member,
    amount,
    method: "balance",
    kind: "reservation",
    created_at: billTime,
  });
  if (s.overtime && s.overtime > 0) {
    const extra = +(area.price_hourly * (s.overtime / 60)).toFixed(2);
    seedBills.push({
      id: `B-${s.id}-OT`,
      reservation_id: s.id,
      member_id: s.member,
      amount: extra,
      method: "balance",
      kind: "overtime",
      created_at: s.checkOutH != null ? (s.day === 0 ? todayAt(s.checkOutH) : daysAgoAt(-s.day, s.checkOutH)) : end,
    });
  }
}

export const seedPrintItems: PrintItem[] = [
  { id: "print-bw-a4", category: "bw_a4", name: "黑白 A4", price_per_sheet: 0.5, enabled: true },
  { id: "print-color-a4", category: "color_a4", name: "彩色 A4", price_per_sheet: 2, enabled: true },
  { id: "print-bw-a3", category: "bw_a3", name: "黑白 A3", price_per_sheet: 1, enabled: true },
  { id: "print-color-a3", category: "color_a3", name: "彩色 A3", price_per_sheet: 4, enabled: true },
];

export const seedSnackItems: SnackItem[] = [
  { id: "snack-001", category: "drink", name: "农夫山泉 550ml", barcode: "6901285991219", price: 3, stock: 48, enabled: true },
  { id: "snack-002", category: "drink", name: "可口可乐 330ml", barcode: "6901939621103", price: 4, stock: 36, enabled: true },
  { id: "snack-003", category: "drink", name: "元气森林 白桃味", barcode: "6970815920156", price: 6, stock: 24, enabled: true },
  { id: "snack-004", category: "drink", name: "瑞幸美式咖啡", barcode: "6975006223482", price: 15, stock: 12, enabled: true },
  { id: "snack-005", category: "snack", name: "乐事薯片 原味", barcode: "6924743915818", price: 8, stock: 20, enabled: true },
  { id: "snack-006", category: "snack", name: "德芙巧克力", barcode: "6923644266684", price: 12, stock: 15, enabled: true },
  { id: "snack-007", category: "instant", name: "康师傅红烧牛肉面", barcode: "6920152485652", price: 6, stock: 30, enabled: true },
  { id: "snack-008", category: "instant", name: "自热米饭 宫保鸡丁", barcode: "6971234567890", price: 18, stock: 10, enabled: true },
  { id: "snack-009", category: "other", name: "便签本 A5", barcode: "6900000000001", price: 5, stock: 25, enabled: true },
  { id: "snack-010", category: "other", name: "中性笔 黑色", barcode: "6900000000002", price: 3, stock: 40, enabled: true },
];

// 为正在在场的会员添加一些挂账记录
seedBills.push({
  id: "B-R-1005-PRINT",
  reservation_id: "R-1005",
  member_id: "M04",
  amount: 5,
  method: "balance",
  kind: "print",
  created_at: todayAt(10, 30),
  note: "黑白A4 × 10张",
});
seedBills.push({
  id: "B-R-1005-SNACK",
  reservation_id: "R-1005",
  member_id: "M04",
  amount: 4,
  method: "balance",
  kind: "snack",
  created_at: todayAt(11, 0),
  note: "可口可乐 × 1",
});
seedBills.push({
  id: "B-R-1006-SNACK",
  reservation_id: "R-1006",
  member_id: "M05",
  amount: 21,
  method: "balance",
  kind: "snack",
  created_at: todayAt(10, 0),
  note: "元气森林 × 1、德芙巧克力 × 1、乐事薯片 × 1",
});

export const seedData = {
  areas: seedAreas,
  spaces: seedSpaces,
  members: seedMembers,
  reservations: seedReservations,
  accessTokens: seedAccessTokens,
  attendance: seedAttendance,
  bills: seedBills,
  accessLogs: seedAccessLogs,
  blacklist: seedBlacklist,
  blacklistReasons: seedBlacklistReasons,
  permanentSeats: seedPermanentSeats,
  printItems: seedPrintItems,
  snackItems: seedSnackItems,
};
