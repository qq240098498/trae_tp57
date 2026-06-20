export type AreaType = "open" | "booth" | "room";

export type Plan = "hourly" | "day" | "month" | "times";

export type SpaceStatus = "free" | "occupied" | "reserved" | "maintenance";

export type ReservationStatus = "pending" | "active" | "done" | "cancelled";

export type TokenStatus = "issued" | "revoked" | "failed";

export type PayMethod = "balance" | "wechat" | "cash";

export interface Area {
  id: string;
  name: string;
  type: AreaType;
  desc: string;
  price_hourly: number;
  price_day: number;
  price_month: number;
  price_times: number;
}

export interface Space {
  id: string;
  area_id: string;
  label: string;
  status: SpaceStatus;
  row: number;
  col: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  balance: number;
  joined_at: string;
}

export interface Reservation {
  id: string;
  member_id: string;
  space_id: string;
  plan: Plan;
  start: string;
  end: string;
  status: ReservationStatus;
  amount: number;
  created_at: string;
}

export interface AccessToken {
  id: string;
  reservation_id: string;
  space_id: string;
  valid_from: string;
  valid_to: string;
  status: TokenStatus;
}

export interface Attendance {
  id: string;
  reservation_id: string;
  check_in: string;
  check_out?: string;
}

export interface Bill {
  id: string;
  reservation_id: string;
  member_id: string;
  amount: number;
  method: PayMethod;
  kind: "reservation" | "overtime";
  created_at: string;
}

export interface AccessLog {
  id: string;
  token_id: string;
  space_id: string;
  time: string;
  action: "issue" | "open" | "revoke";
  result: "success" | "failed";
}

export type BlacklistReason = "noise" | "damage" | "skipped_payment";

export interface BlacklistEntry {
  id: string;
  member_id: string;
  reason: BlacklistReason;
  note: string;
  created_at: string;
}

export interface ReservationInput {
  member_id: string;
  space_id: string;
  plan: Plan;
  start: string;
  end: string;
  method: PayMethod;
}

export const AREA_TYPE_LABEL: Record<AreaType, string> = {
  open: "开放区",
  booth: "单人隔间",
  room: "双人研讨室",
};

export const PLAN_LABEL: Record<Plan, string> = {
  hourly: "按小时",
  day: "天卡",
  month: "月卡",
  times: "次卡",
};

export const SPACE_STATUS_LABEL: Record<SpaceStatus, string> = {
  free: "空闲",
  occupied: "使用中",
  reserved: "已预约",
  maintenance: "维护中",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "待签到",
  active: "使用中",
  done: "已完成",
  cancelled: "已取消",
};

export const TOKEN_STATUS_LABEL: Record<TokenStatus, string> = {
  issued: "已下发",
  revoked: "已回收",
  failed: "下发失败",
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  balance: "余额",
  wechat: "微信",
  cash: "现金",
};

export const BLACKLIST_REASON_LABEL: Record<BlacklistReason, string> = {
  noise: "噪音投诉",
  damage: "损坏设施",
  skipped_payment: "逃单",
};
