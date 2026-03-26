import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAlerts, listEquipment, listWorkOrders } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { fmtTime } from "../utils/format";
import { severityToTone } from "../utils/maintenanceLogic";

/**
 * PUBLIC_INTERFACE
 * Main dashboard page.
 */
export function DashboardPage() {
  const equipmentQ = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });
  const alertsQ = useQuery({ queryKey: ["alerts"], queryFn: () => listAlerts({}) });
  const wosQ = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders({}) });

  const kpis = useMemo(() => {
    const equipment = equipmentQ.data || [];
    const alerts = alertsQ.data || [];
    const wos = wosQ.data || [];
    const openAlerts = alerts.filter((a) => a.status === "Open").length;
    const openWos = wos.filter((w) => w.status !== "Closed").length;
    const atRisk = equipment.filter((e) => e.status !== "Healthy").length;
    const criticalAlerts = alerts.filter((a) => a.severity === "Critical" && a.status !== "Closed").length;

    return { equipment: equipment.length, openAlerts, openWos, atRisk, criticalAlerts };
  }, [equipmentQ.data, alertsQ.data, wosQ.data]);

  const isLoading = equipmentQ.isLoading || alertsQ.isLoading || wosQ.isLoading;
  const isError = equipmentQ.isError || alertsQ.isError || wosQ.isError;

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <p className="pageSubtitle">Operational overview: health, alerts, and active work.</p>
        </div>
      </header>

      {isLoading ? <div className="card">Loading dashboard…</div> : null}
      {isError ? <div className="card">Failed to load dashboard data.</div> : null}

      {!isLoading && !isError ? (
        <>
          <div className="kpis">
            <div className="card">
              <p className="kpiLabel">Equipment</p>
              <p className="kpiValue">{kpis.equipment}</p>
            </div>
            <div className="card">
              <p className="kpiLabel">Open Alerts</p>
              <p className="kpiValue">{kpis.openAlerts}</p>
            </div>
            <div className="card">
              <p className="kpiLabel">Active Work Orders</p>
              <p className="kpiValue">{kpis.openWos}</p>
            </div>
            <div className="card">
              <p className="kpiLabel">At-Risk Assets</p>
              <p className="kpiValue">{kpis.atRisk}</p>
            </div>
          </div>

          <div className="grid2">
            <Card
              title="Latest Alerts"
              hint="Most recent alert signals from sensor/operator logs."
            >
              {(alertsQ.data || []).length === 0 ? (
                <EmptyState title="No alerts" description="When thresholds are breached, alerts will appear here." />
              ) : (
                <table className="table" aria-label="Latest alerts table">
                  <thead>
                    <tr>
                      <th>Alert</th>
                      <th>Equipment</th>
                      <th>Severity</th>
                      <th>Score</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(alertsQ.data || []).slice(0, 5).map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{a.title}</div>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>{a.parameter}: {a.value}{a.unit}</div>
                        </td>
                        <td>{a.equipmentId}</td>
                        <td>
                          <Badge tone={severityToTone(a.severity)} label={a.severity} />
                        </td>
                        <td>{a.score}</td>
                        <td>{fmtTime(a.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card
              title="Active Work Orders"
              hint="Orders opened/triaged from alerts. Track closure for audit trail."
            >
              {(wosQ.data || []).filter((w) => w.status !== "Closed").length === 0 ? (
                <EmptyState title="No active work orders" description="Convert an alert into a work order from the Alerts page." />
              ) : (
                <table className="table" aria-label="Work orders table">
                  <thead>
                    <tr>
                      <th>Work Order</th>
                      <th>Priority</th>
                      <th>Assigned</th>
                      <th>Status</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(wosQ.data || []).filter((w) => w.status !== "Closed").slice(0, 5).map((w) => (
                      <tr key={w.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{w.title}</div>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>{w.id} • {w.equipmentId}</div>
                        </td>
                        <td>
                          <Badge tone={severityToTone(w.priority)} label={w.priority} />
                        </td>
                        <td>{w.assignedTo}</td>
                        <td><span className="pill">{w.status}</span></td>
                        <td>{fmtTime(w.dueAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <div style={{ marginTop: 16 }}>
            <Card title="Critical Signals" hint="Focus on urgent alerts and assets in critical state.">
              <div className="twoCol">
                <div className="stack">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800 }}>Critical open alerts</div>
                    <Badge tone="danger" label={String(kpis.criticalAlerts)} />
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    Critical alerts should be converted to work orders immediately to reduce unplanned downtime.
                  </div>
                </div>
                <div className="stack">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800 }}>At-risk assets</div>
                    <Badge tone={kpis.atRisk > 0 ? "warn" : "success"} label={String(kpis.atRisk)} />
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    At-risk assets are derived from open alerts; close orders to restore health state.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
