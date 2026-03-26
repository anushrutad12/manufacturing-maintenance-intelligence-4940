import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listParts } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

/**
 * PUBLIC_INTERFACE
 * Spare parts inventory page.
 */
export function PartsPage() {
  const partsQ = useQuery({ queryKey: ["parts"], queryFn: listParts });

  const sorted = useMemo(() => {
    const arr = partsQ.data || [];
    return arr.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [partsQ.data]);

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Parts Inventory</h1>
          <p className="pageSubtitle">Track stock, reorder points, and availability for active work orders.</p>
        </div>
      </header>

      <Card title="Spare Parts" hint="Reserve parts from Work Orders to decrement stock.">
        {partsQ.isLoading ? (
          <div>Loading…</div>
        ) : partsQ.isError ? (
          <div style={{ color: "var(--danger)" }}>Failed to load parts.</div>
        ) : (
          <table className="table" aria-label="Parts inventory table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Location</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const below = p.stock <= p.reorderPoint;
                const out = p.stock === 0;
                const tone = out ? "danger" : below ? "warn" : "success";
                const label = out ? "Out of Stock" : below ? "Low Stock" : "Available";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{p.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.id}</div>
                    </td>
                    <td>{p.location}</td>
                    <td style={{ fontWeight: 800 }}>{p.stock}</td>
                    <td>{p.reorderPoint}</td>
                    <td><Badge tone={tone} label={label} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
