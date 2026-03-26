import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closeWorkOrder, listParts, listWorkOrders, reserveParts, updateWorkOrder } from "../services/maintenanceService";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { fmtTime } from "../utils/format";
import { severityToTone } from "../utils/maintenanceLogic";

/**
 * PUBLIC_INTERFACE
 * Work order board.
 */
export function WorkOrdersPage() {
  const qc = useQueryClient();
  const workQ = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders({}) });
  const partsQ = useQuery({ queryKey: ["parts"], queryFn: listParts });

  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => (workQ.data || []).find((w) => w.id === selectedId), [workQ.data, selectedId]);

  const [partsModal, setPartsModal] = useState({ open: false, workOrderId: "", items: [{ partId: "PT-2001", qty: 1 }] });
  const [closeModal, setCloseModal] = useState({ open: false, id: "", closedBy: "technician", notes: "" });

  const patchM = useMutation({
    mutationFn: async ({ id, patch }) => updateWorkOrder(id, patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workOrders"] });
      await qc.invalidateQueries({ queryKey: ["parts"] });
    },
  });

  const reserveM = useMutation({
    mutationFn: async () => reserveParts({ workOrderId: partsModal.workOrderId, items: partsModal.items }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workOrders"] }),
        qc.invalidateQueries({ queryKey: ["parts"] }),
      ]);
      setPartsModal({ open: false, workOrderId: "", items: [{ partId: "PT-2001", qty: 1 }] });
    },
  });

  const closeM = useMutation({
    mutationFn: async () => closeWorkOrder({ id: closeModal.id, closedBy: closeModal.closedBy, notes: closeModal.notes }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workOrders"] }),
        qc.invalidateQueries({ queryKey: ["alerts"] }),
        qc.invalidateQueries({ queryKey: ["equipment"] }),
      ]);
      setCloseModal({ open: false, id: "", closedBy: "technician", notes: "" });
    },
  });

  const groups = useMemo(() => {
    const list = workQ.data || [];
    return {
      Open: list.filter((w) => w.status === "Open"),
      "In Progress": list.filter((w) => w.status === "In Progress"),
      Closed: list.filter((w) => w.status === "Closed"),
    };
  }, [workQ.data]);

  return (
    <div>
      <header className="pageHeader">
        <div>
          <h1 className="pageTitle">Work Order Board</h1>
          <p className="pageSubtitle">Manage triaged alerts, reserve parts, execute maintenance, and close orders with audit trail.</p>
        </div>
      </header>

      <div className="grid3">
        {Object.entries(groups).map(([status, items]) => (
          <Card key={status} title={status} hint={`${items.length} item(s)`}>
            {items.length === 0 ? (
              <EmptyState title="No work orders" description="Work orders appear when alerts are converted for execution." />
            ) : (
              <div className="stack">
                {items.map((w) => (
                  <button
                    key={w.id}
                    className="card"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: selectedId === w.id ? "rgba(37,99,235,0.35)" : "var(--border)",
                      boxShadow: selectedId === w.id ? "0 8px 26px rgba(37,99,235,0.15)" : "var(--shadow)",
                    }}
                    onClick={() => setSelectedId(w.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{w.title}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{w.id} • {w.equipmentId}</div>
                      </div>
                      <Badge tone={severityToTone(w.priority)} label={w.priority} />
                    </div>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <span className="pill">{w.assignedTo}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Due {fmtTime(w.dueAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Card
          title="Work Order Details"
          hint={selected ? "Update status, reserve parts, and close with notes." : "Select a work order from the board above."}
        >
          {!selected ? (
            <EmptyState title="No work order selected" description="Pick an item to see its audit trail and manage execution." />
          ) : (
            <div className="grid2">
              <div className="stack">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{selected.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{selected.id} • Created {fmtTime(selected.createdAt)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge tone={severityToTone(selected.priority)} label={selected.priority} />
                    <span className="pill">{selected.status}</span>
                  </div>
                </div>

                <div className="twoCol">
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Assigned</div>
                    <div style={{ fontWeight: 800 }}>{selected.assignedTo}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Due</div>
                    <div style={{ fontWeight: 800 }}>{fmtTime(selected.dueAt)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    disabled={selected.status !== "Open" || patchM.isPending}
                    onClick={() => patchM.mutate({ id: selected.id, patch: { status: "In Progress" } })}
                  >
                    Start
                  </Button>
                  <Button
                    variant="amber"
                    disabled={selected.status === "Closed" || patchM.isPending}
                    onClick={() => setPartsModal({ open: true, workOrderId: selected.id, items: [{ partId: "PT-2001", qty: 1 }] })}
                  >
                    Reserve Parts
                  </Button>
                  <Button
                    disabled={selected.status === "Closed"}
                    onClick={() => setCloseModal({ open: true, id: selected.id, closedBy: "technician", notes: "" })}
                  >
                    Close Order
                  </Button>
                </div>

                {(patchM.isError || reserveM.isError || closeM.isError) ? (
                  <div style={{ color: "var(--danger)", fontSize: 13 }}>
                    {String((patchM.error || reserveM.error || closeM.error)?.message || "Action failed")}
                  </div>
                ) : null}

                <div className="hr" />

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Audit Trail</div>
                  <div className="stack">
                    {(selected.actions || []).map((a, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{a.note}</div>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>{a.by}</div>
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{fmtTime(a.at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stack">
                <Card title="Parts Reserved" hint="Inventory is reduced when reserved.">
                  {(selected.parts || []).length === 0 ? (
                    <EmptyState title="No parts reserved" description="Reserve parts to ensure availability before maintenance execution." />
                  ) : (
                    <table className="table" aria-label="Reserved parts table">
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.parts || []).map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.name} <span style={{ color: "var(--muted)", fontSize: 12 }}>({p.partId})</span></td>
                            <td>{p.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>

                <Card title="Closure" hint="Completed orders restore machine health by closing associated alerts.">
                  {selected.closure ? (
                    <div className="stack">
                      <div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>Closed at</div>
                        <div style={{ fontWeight: 800 }}>{fmtTime(selected.closure.at)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>Closed by</div>
                        <div style={{ fontWeight: 800 }}>{selected.closure.closedBy}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>Notes</div>
                        <div style={{ fontWeight: 700 }}>{selected.closure.notes}</div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="Not closed" description="Close the work order once actions are completed and verified." />
                  )}
                </Card>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal open={partsModal.open} title="Reserve Parts" onClose={() => setPartsModal({ open: false, workOrderId: "", items: [{ partId: "PT-2001", qty: 1 }] })}>
        <div className="stack">
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Reserving parts reduces inventory. Insufficient stock will block reservation.
          </div>

          {(partsModal.items || []).map((it, idx) => (
            <div className="fieldRow" key={idx}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Part</label>
                <select
                  className="select"
                  value={it.partId}
                  onChange={(e) => {
                    const next = partsModal.items.slice();
                    next[idx] = { ...next[idx], partId: e.target.value };
                    setPartsModal({ ...partsModal, items: next });
                  }}
                >
                  {(partsQ.data || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Qty</label>
                <input
                  className="input"
                  value={String(it.qty)}
                  onChange={(e) => {
                    const next = partsModal.items.slice();
                    next[idx] = { ...next[idx], qty: Number(e.target.value) };
                    setPartsModal({ ...partsModal, items: next });
                  }}
                />
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Button
              onClick={() =>
                setPartsModal({
                  ...partsModal,
                  items: [...partsModal.items, { partId: (partsQ.data || [])[0]?.id || "PT-2001", qty: 1 }],
                })
              }
            >
              Add Item
            </Button>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => setPartsModal({ open: false, workOrderId: "", items: [{ partId: "PT-2001", qty: 1 }] })}>Cancel</Button>
              <Button variant="primary" onClick={() => reserveM.mutate()} disabled={reserveM.isPending}>
                {reserveM.isPending ? "Reserving…" : "Reserve"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={closeModal.open} title="Close Work Order" onClose={() => setCloseModal({ open: false, id: "", closedBy: "technician", notes: "" })}>
        <div className="stack">
          <div className="fieldRow">
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Closed by</label>
              <input className="input" value={closeModal.closedBy} onChange={(e) => setCloseModal({ ...closeModal, closedBy: e.target.value })} />
            </div>
            <div />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--muted)" }}>Closure notes</label>
            <input className="input" value={closeModal.notes} onChange={(e) => setCloseModal({ ...closeModal, notes: e.target.value })} placeholder="Actions performed, parts replaced, verification..." />
          </div>

          {closeM.isError ? (
            <div style={{ color: "var(--danger)", fontSize: 13 }}>{String(closeM.error?.message || "Close failed")}</div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button onClick={() => setCloseModal({ open: false, id: "", closedBy: "technician", notes: "" })}>Cancel</Button>
            <Button variant="primary" onClick={() => closeM.mutate()} disabled={!closeModal.id || !closeModal.closedBy || !closeModal.notes || closeM.isPending}>
              {closeM.isPending ? "Closing…" : "Close Order"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
