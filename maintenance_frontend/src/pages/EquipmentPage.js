import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEquipment, listEquipment } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";

/**
 * PUBLIC_INTERFACE
 * Equipment registry page.
 */
export function EquipmentPage() {
  const qc = useQueryClient();
  const equipmentQ = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });

  const [form, setForm] = useState({
    name: "",
    area: "",
    model: "",
    vibrationWarn: "5",
    vibrationDanger: "7",
    tempWarn: "75",
    tempDanger: "90",
    pressureWarn: "2.2",
    pressureDanger: "2.8",
  });

  const createM = useMutation({
    mutationFn: async () => {
      return createEquipment({
        name: form.name.trim(),
        area: form.area.trim(),
        model: form.model.trim(),
        thresholds: {
          vibration: { warn: Number(form.vibrationWarn), danger: Number(form.vibrationDanger), unit: "mm/s" },
          temperature: { warn: Number(form.tempWarn), danger: Number(form.tempDanger), unit: "°C" },
          pressure: { warn: Number(form.pressureWarn), danger: Number(form.pressureDanger), unit: "bar" },
        },
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["equipment"] });
      setForm((f) => ({ ...f, name: "", model: "" }));
    },
  });

  const sorted = useMemo(() => {
    const arr = equipmentQ.data || [];
    return arr.slice().sort((a, b) => a.id.localeCompare(b.id));
  }, [equipmentQ.data]);

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Equipment Register</h1>
          <p className="pageSubtitle">Register machines and configure health parameter thresholds.</p>
        </div>
      </header>

      <div className="grid2">
        <Card title="Register Equipment" hint="Thresholds drive alert creation from parameter logs.">
          <div className="stack">
            <div className="fieldRow">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CNC Mill #4" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Area</label>
                <input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Machining" />
              </div>
            </div>
            <div className="fieldRow">
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Model</label>
                <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. HAAS VF-2" />
              </div>
              <div />
            </div>

            <div className="hr" />

            <div className="twoCol">
              <Card title="Vibration" hint="mm/s (warn/danger)">
                <div className="fieldRow">
                  <input className="input" value={form.vibrationWarn} onChange={(e) => setForm({ ...form, vibrationWarn: e.target.value })} />
                  <input className="input" value={form.vibrationDanger} onChange={(e) => setForm({ ...form, vibrationDanger: e.target.value })} />
                </div>
              </Card>
              <Card title="Temperature" hint="°C (warn/danger)">
                <div className="fieldRow">
                  <input className="input" value={form.tempWarn} onChange={(e) => setForm({ ...form, tempWarn: e.target.value })} />
                  <input className="input" value={form.tempDanger} onChange={(e) => setForm({ ...form, tempDanger: e.target.value })} />
                </div>
              </Card>
            </div>

            <Card title="Pressure" hint="bar (warn/danger)">
              <div className="fieldRow">
                <input className="input" value={form.pressureWarn} onChange={(e) => setForm({ ...form, pressureWarn: e.target.value })} />
                <input className="input" value={form.pressureDanger} onChange={(e) => setForm({ ...form, pressureDanger: e.target.value })} />
              </div>
            </Card>

            {createM.isError ? (
              <div style={{ color: "var(--danger)", fontSize: 13 }}>{String(createM.error?.message || "Create failed")}</div>
            ) : null}

            <Button
              variant="primary"
              onClick={() => createM.mutate()}
              disabled={!form.name.trim() || !form.area.trim() || createM.isPending}
            >
              {createM.isPending ? "Registering…" : "Register Equipment"}
            </Button>
          </div>
        </Card>

        <Card title="Equipment List" hint="Health is derived from open alerts.">
          {equipmentQ.isLoading ? (
            <div>Loading…</div>
          ) : equipmentQ.isError ? (
            <div style={{ color: "var(--danger)" }}>Failed to load equipment.</div>
          ) : (
            <table className="table" aria-label="Equipment registry table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset</th>
                  <th>Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => (
                  <tr key={e.id}>
                    <td><span className="pill">{e.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{e.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>{e.model}</div>
                    </td>
                    <td>{e.area}</td>
                    <td>
                      <Badge tone={e.status === "Healthy" ? "success" : e.status === "Critical" ? "danger" : "warn"} label={e.status} />
                    </td>
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
