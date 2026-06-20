import { Badge } from "./Badge";
import type {
  SpaceStatus,
  ReservationStatus,
  TokenStatus,
  Plan,
  AreaType,
  BlacklistReason,
} from "@/data/types";
import {
  SPACE_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
  TOKEN_STATUS_LABEL,
  PLAN_LABEL,
  AREA_TYPE_LABEL,
  BLACKLIST_REASON_LABEL,
} from "@/data/types";

const spaceTone: Record<SpaceStatus, "sage" | "amber" | "indigo" | "clay"> = {
  free: "sage",
  occupied: "amber",
  reserved: "indigo",
  maintenance: "clay",
};

const resTone: Record<ReservationStatus, "indigo" | "amber" | "sage" | "neutral"> = {
  pending: "indigo",
  active: "amber",
  done: "sage",
  cancelled: "neutral",
};

const tokenTone: Record<TokenStatus, "sage" | "clay" | "rose"> = {
  issued: "sage",
  revoked: "clay",
  failed: "rose",
};

export function SpaceStatusBadge({ status }: { status: SpaceStatus }) {
  return (
    <Badge tone={spaceTone[status]} dot>
      {SPACE_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge tone={resTone[status]}>{RESERVATION_STATUS_LABEL[status]}</Badge>;
}

export function TokenStatusBadge({ status }: { status: TokenStatus }) {
  return (
    <Badge tone={tokenTone[status]} dot>
      {TOKEN_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return <Badge tone="neutral">{PLAN_LABEL[plan]}</Badge>;
}

export function AreaTypeBadge({ type }: { type: AreaType }) {
  return <Badge tone="neutral">{AREA_TYPE_LABEL[type]}</Badge>;
}

const blacklistTone: Record<BlacklistReason, "rose" | "clay" | "amber"> = {
  noise: "amber",
  damage: "clay",
  skipped_payment: "rose",
};

export function BlacklistReasonBadge({ reason }: { reason: BlacklistReason }) {
  return (
    <Badge tone={blacklistTone[reason]} dot>
      {BLACKLIST_REASON_LABEL[reason]}
    </Badge>
  );
}
