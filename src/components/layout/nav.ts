import {
  LayoutDashboard,
  Armchair,
  CalendarClock,
  DoorOpen,
  ReceiptText,
  KeyRound,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const navItems: NavItem[] = [
  { to: "/", label: "数据概览", icon: LayoutDashboard, desc: "今日运营全局" },
  { to: "/spaces", label: "座位/房间", icon: Armchair, desc: "分区与定价" },
  { to: "/reservations", label: "预约管理", icon: CalendarClock, desc: "时段与套餐" },
  { to: "/attendance", label: "签到签退", icon: DoorOpen, desc: "实时在场" },
  { to: "/billing", label: "消费记录", icon: ReceiptText, desc: "账单与营收" },
  { to: "/access", label: "门禁联动", icon: KeyRound, desc: "权限与日志" },
  { to: "/blacklist", label: "黑名单管理", icon: ShieldAlert, desc: "风险会员" },
];
