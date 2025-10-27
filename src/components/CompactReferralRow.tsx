import React from "react";
import { StoplightBadge } from "./ui/StoplightBadge";
import { cn } from "@/lib/utils";

export function CompactReferralRow({
  name,
  payer,
  statusColor,
  lastTouch,
  onOpen,
}: {
  name: string;
  payer?: string;
  statusColor: "green" | "yellow" | "red";
  lastTouch?: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="ref-row"
      aria-label={`Open referral for ${name}`}
    >
      <StoplightBadge color={statusColor} />
      <span className={cn("name", "truncate-soft")}>{name}</span>
      {payer && <span className={cn("payer", "truncate-soft")}>{payer}</span>}
      {lastTouch && <span className="age">{lastTouch}</span>}
      <span className="cta">Open</span>
    </button>
  );
}
