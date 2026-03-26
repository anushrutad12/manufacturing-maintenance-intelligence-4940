import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

/**
 * PUBLIC_INTERFACE
 * 404 page.
 */
export function NotFoundPage() {
  return (
    <Card title="Page not found" hint="The requested route does not exist.">
      <div className="stack">
        <div style={{ color: "var(--muted)" }}>
          Use the side navigation to access dashboards, equipment, alerts, and work orders.
        </div>
        <Link to="/">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}
