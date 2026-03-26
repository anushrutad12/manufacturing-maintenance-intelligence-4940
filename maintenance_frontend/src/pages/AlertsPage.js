import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWorkOrderFromAlert, listAlerts, listEquipment, listWorkOrders } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { fmtTime } from "../utils/format";
import { severityToTone } from "../utils/maintenanceLogic";

/**
 * PUBLIC_INTERFACE
 * Alerts center.
 */
export function AlertsPage() {
  const qc = useQueryClient();
  const equipmentQ = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });
  const alertsQ = useQuery({ queryKey: ["alerts"], queryFn: () => listAlerts({}) });
  const workQ = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders({}) });

  const [status, setStatus] = useState("Open");
  const [equipmentId, setEquipmentId] = useState("");

  const filtered = useMemo(() => {
    let arr = alertsQ.data || [];
    if (status) arr = arr.filter((a) => a.status === status);
    if (equipmentId) arr = arr.filter((a) => a.equipmentId === equipmentId);
    return arr;
  }, [alertsQ.data, status, equipmentId]);

  const [triage, setTriage] = useState({ open: false, alertId: "", assignedTo: "Maintenance Team A", dueAt: "" });

  const triageM = useMutation({
    mutationFn: async () => {
      return createWorkOrderFromAlert({
        alertId: triage.alertId,
        assignedTo: triage.assignedTo,
        dueAt: triage.dueAt,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["alerts"] }),
        qc.invalidateQueries({ queryKey: ["workOrders"] }),
      ]);
      setTriage({ open: false, alertId: "", assignedTo: "Maintenance Team A", dueAt: "" });
    },
  });

  const canTriage = (alertId) => !(workQ.data || []).some((w) => w.alertId === alertId);

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Alerts Center</h1>
          <p className="pageSubtitle">Prioritized alerts triggered by threshold breaches. Convert to work orders for execution.</p>
        </div>
        <div className="toolbar">
          <select className="select" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Open">Open</option>
            <option value="Triaged">Triaged</option>
            <option value="Closed">Closed</option>
          </select>
          <select className="select" style={{ width: 240 }} value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">All equipment</option>
            {(equipmentQ.data || []).map((e) => (
              <option value={e.id} key={e.id}>{e.id} — {e.name}</option>
            ))}
          </select>
        </div>
      </header>

      <Card title="Alerts" hint="Score reflects breach magnitude. Critical/high should be triaged quickly.">
        {alertsQ.isLoading ? (
          <div>Loading…</div>
        ) : alertsQ.isError ? (
          <div style={{ color: "var(--danger)" }}>Failed to load alerts.</div>
        ) : (
          <table className="table" aria-label="Alerts table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Severity</th>
                <th>Score</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{a.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {a.equipmentId} • {a.parameter}: {a.value}{a.unit}
                    </div>
                    {a.description ? <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{a.description}</div> : null}
                  </td>
                  <td>
                    <Badge tone={severityToTone(a.severity)} label={a.severity} />
                  </td>
                  <td>{a.score}</td>
                  <td><span className="pill">{a.status}</span></td>
                  <td>{fmtTime(a.createdAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Button
                      variant="amber"
                      disabled={a.status !== "Open" || !canTriage(a.id)}
                      onClick={() =>
                        setTriage({
                          open: true,
                          alertId: a.id,
                          assignedTo: "Maintenance Team A",
                          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
                        })
                      }
                    >
                      Create Work Order
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={triage.open}
        title="Convert Alert to Work Order"
        onClose={() => setTriage({ open: false, alertId: "", assignedTo: "Maintenance Team A", dueAt: "" })}
      >
        <div className="stack">
          <div className="fieldRow">
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Assigned team</label>
              <input className="input" value={triage.assignedTo} onChange={(e) => setTriage({ ...triage, assignedTo: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Due (ISO)</label>
              <input className="input" value={triage.dueAt} onChange={(e) => setTriage({ ...triage, dueAt: e.target.value })} />
            </div>
          </div>

          {triageM.isError ? (
            <div style={{ color: "var(--danger)", fontSize: 13 }}>{String(triageM.error?.message || "Failed to create work order")}</div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button onClick={() => setTriage({ open: false, alertId: "", assignedTo: "Maintenance Team A", dueAt: "" })}>Cancel</Button>
            <Button variant="primary" onClick={() => triageM.mutate()} disabled={!triage.alertId || !triage.assignedTo || !triage.dueAt || triageM.isPending}>
              {triageM.isPending ? "Creating…" : "Create Work Order"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
