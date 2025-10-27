import React from "react";
import { cn } from "@/lib/utils";

type LightColor = "green" | "yellow" | "red";

const tooltips: Record<LightColor, string> = {
  green: "Intake cleared; proceed to order.",
  yellow: "Risk flagged; review documents or payer notes.",
  red: "Declined; see denial reason and next action.",
};

export function StoplightBadge({
  color,
  label,
  size = "auto",
  className,
}: { color: LightColor; label?: string; size?: "auto" | "sm" | "md" | "lg", className?: string }) {
  const px = size === "sm" ? 10 : size === "lg" ? 16 : size === "md" ? 12 : undefined;
  const dim = px ?? undefined;
  const tooltipText = label ? `${label}: ${tooltips[color]}` : tooltips[color];

  return (
    <span
      role="img"
      aria-label={label ?? `${color} status`}
      title={tooltipText}
      className={cn("inline-flex items-center gap-1.5 leading-none align-middle", className)}
    >
      <span
        style={{
          width: dim ?? "clamp(10px, 2.2cqw, 14px)",
          height: dim ?? "clamp(10px, 2.2cqw, 14px)",
          borderRadius: "999px",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08) inset",
          background:
            color === "green" ? "#22c55e" : color === "yellow" ? "#eab308" : "#ef4444",
          flex: "0 0 auto",
        }}
      />
      {label && (
        <span className="text-xs text-muted">
          {label}
        </span>
      )}
    </span>
  );
}
