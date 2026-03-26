import React from "react";

/**
 * PUBLIC_INTERFACE
 * @param {{ tone: "info"|"warn"|"danger"|"success", label: string }} props
 */
export function Badge({ tone, label }) {
  const cls =
    tone === "danger"
      ? "badge badgeDanger"
      : tone === "warn"
        ? "badge badgeWarn"
        : tone === "success"
          ? "badge badgeSuccess"
          : "badge badgeInfo";

  const dotColor =
    tone === "danger"
      ? "var(--danger)"
      : tone === "warn"
        ? "var(--warning)"
        : tone === "success"
          ? "var(--success)"
          : "var(--primary)";

  return (
    <span className={cls}>
      <span className="badgeDot" style={{ background: dotColor }} aria-hidden="true" />
      {label}
    </span>
  );
}
