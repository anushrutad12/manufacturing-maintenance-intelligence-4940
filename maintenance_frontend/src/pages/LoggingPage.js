import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLog, listEquipment, listLogs } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { fmtTime } from "../utils/format";

/**
 * PUBLIC_INTERFACE
 * Parameter logging page.
 */
export function LoggingPage() {
  const qc = useQueryClient();
  const equipmentQ = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });
  const [equipmentId, setEquipmentId] = useState("EQ-1001");

  const logsQ = useQuery({
    queryKey: ["logs", equipmentId],
    queryFn: () => listLogs({ equipmentId }),
    enabled: Boolean(equipmentId),
  });

  const eq = useMemo(() => (equipmentQ.data || []).find((e) => e.id === equipmentId), [equipmentQ.data, equipmentId]);

  const [form, setForm] = useState({
    parameter: "vibration",
    value: "6.1",
    recordedBy: "sensor",
    note: "",
  });

  const createM = useMutation({
    mutationFn: async () => {
      return createLog({
        equipmentId,
        parameter: form.parameter,
        value: Number(form.value),
        recordedBy: form.recordedBy,
        note: form.note,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["logs", equipmentId] }),
        qc.invalidateQueries({ queryKey: ["alerts"] }),
        qc.invalidateQueries({ queryKey: ["equipment"] }),
      ]);
      setForm((f) => ({ ...f, note: "" }));
    },
  });

  const unit = eq?.thresholds?.[form.parameter]?.unit || "";

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Parameter Logging</h1>
          <p className="pageSubtitle">Log sensor/operator values. Alerts are automatically created if thresholds are breached.</p>
        </div>
      </header>

      <div className="grid2">
        <Card title="New Log Entry" hint="Data → Threshold → Alert → Work Order → Closure">
          <div className="stack">
            <div className="fieldRow">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Equipment</label>
                <select className="select" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
                  {(equipmentQ.data || []).map((e) => (
                    <option value={e.id} key={e.id}>{e.id} — {e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Recorded by</label>
                <select className="select" value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })}>
                  <option value="sensor">Sensor</option>
                  <option value="operator">Operator</option>
                </select>
              </div>
            </div>

            <div className="fieldRow">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Parameter</label>
                <select className="select" value={form.parameter} onChange={(e) => setForm({ ...form, parameter: e.target.value })}>
                  <option value="vibration">Vibration</option>
                  <option value="temperature">Temperature</option>
                  <option value="pressure">Pressure</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Value {unit ? `(${unit})` : ""}</label>
                <input className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Note</label>
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional observation..." />
            </div>

            {createM.isError ? (
              <div style={{ color: "var(--danger)", fontSize: 13 }}>{String(createM.error?.message || "Log create failed")}</div>
            ) : null}

            <Button variant="primary" onClick={() => createM.mutate()} disabled={!equipmentId || createM.isPending}>
              {createM.isPending ? "Saving…" : "Create Log"}
            </Button>

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Tip: Enter a value above the configured danger threshold to see a new alert appear in Alerts Center.
            </div>
          </div>
        </Card>

        <Card title="Recent Logs" hint="Latest values for the selected equipment.">
          {logsQ.isLoading ? (
            <div>Loading…</div>
          ) : logsQ.isError ? (
            <div style={{ color: "var(--danger)" }}>Failed to load logs.</div>
          ) : (
            <table className="table" aria-label="Logs table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {(logsQ.data || []).slice(0, 12).map((l) => (
                  <tr key={l.id}>
                    <td>{fmtTime(l.recordedAt)}</td>
                    <td style={{ fontWeight: 700 }}>{l.parameter}</td>
                    <td>
                      {l.value} {l.unit}
                      {l.note ? <div style={{ color: "var(--muted)", fontSize: 12 }}>{l.note}</div> : null}
                    </td>
                    <td><span className="pill">{l.recordedBy}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
