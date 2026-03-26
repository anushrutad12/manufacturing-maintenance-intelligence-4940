import React from "react";

/**
 * PUBLIC_INTERFACE
 * @param {{ title: string, description?: string, action?: any }} props
 */
export function EmptyState({ title, description, action }) {
  return (
    <div style={{ padding: 12, border: "1px dashed var(--border)", borderRadius: 14, color: "var(--muted)" }}>
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
      {description ? <div style={{ fontSize: 13, marginBottom: action ? 10 : 0 }}>{description}</div> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
