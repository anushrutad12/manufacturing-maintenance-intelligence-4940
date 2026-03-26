import React, { useEffect } from "react";
import { Button } from "./Button";

/**
 * PUBLIC_INTERFACE
 * @param {{ open: boolean, title: string, children: any, onClose: () => void }} props
 */
export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <Button onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>
        <div className="hr" />
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}
