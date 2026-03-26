import React from "react";

/**
 * PUBLIC_INTERFACE
 * @param {{ title?: string, hint?: string, action?: any, children: any }} props
 */
export function Card({ title, hint, action, children }) {
  return (
    <section className="card">
      {(title || hint || action) && (
        <div className="cardHeaderRow">
          <div>
            {title && <h3 className="cardTitle">{title}</h3>}
            {hint && <div className="cardHint">{hint}</div>}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
