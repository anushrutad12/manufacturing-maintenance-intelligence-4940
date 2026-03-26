import { apiRequest } from "./apiClient";
import { mockDb, SEVERITY } from "./mockDb";
import { deriveEquipmentHealth, evaluateThreshold, scoreBreach } from "../utils/maintenanceLogic";

const USE_MOCKS = String(process.env.REACT_APP_USE_MOCKS || "").toLowerCase() === "true";

/**
 * Try backend first (if configured) unless mocks forced. Fallback to mocks on error.
 */
async function withFallback(fnBackend, fnMock) {
  if (USE_MOCKS) return fnMock();
  try {
    return await fnBackend();
  } catch (e) {
    // Backend may not be implemented yet; fallback to mocks for preview readiness.
    return fnMock();
  }
}

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

/**
 * Best-effort normalization for endpoints that are expected to return a list.
 * Some backends return wrapper objects like `{ items: [...] }` or `{ data: [...] }`.
 *
 * Keeping this logic in the service layer ensures all UI consumers can safely
 * assume array semantics (e.g. `.filter`, `.map`).
 *
 * @param {any} payload
 * @returns {any[]}
 */
function coerceArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
  }
  return [];
}

/**
 * PUBLIC_INTERFACE
 * List equipment.
 */
export async function listEquipment() {
  return withFallback(
    async () => apiRequest("/equipment"),
    async () => clone(mockDb.equipment)
  );
}

/**
 * PUBLIC_INTERFACE
 * Create equipment with thresholds.
 * @param {{ id?: string, name: string, area: string, model?: string, thresholds: any }} payload
 */
export async function createEquipment(payload) {
  return withFallback(
    async () => apiRequest("/equipment", { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const id = payload.id || `EQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const item = {
        id,
        name: payload.name,
        area: payload.area,
        model: payload.model || "Generic",
        thresholds: payload.thresholds,
        status: "Healthy",
        updatedAt: new Date().toISOString(),
      };
      mockDb.equipment.unshift(item);
      return clone(item);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * List logs (optionally by equipment).
 * @param {{ equipmentId?: string }} params
 */
export async function listLogs(params = {}) {
  return withFallback(
    async () => apiRequest("/logs", { query: params }),
    async () => {
      const { equipmentId } = params;
      const logs = equipmentId ? mockDb.logs.filter((l) => l.equipmentId === equipmentId) : mockDb.logs;
      return clone(logs).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * Create a new parameter log and auto-create alerts if thresholds are breached.
 * @param {{ equipmentId: string, parameter: string, value: number, unit?: string, recordedBy: "sensor"|"operator", note?: string }} payload
 */
export async function createLog(payload) {
  return withFallback(
    async () => apiRequest("/logs", { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const eq = mockDb.equipment.find((e) => e.id === payload.equipmentId);
      if (!eq) throw new Error("Equipment not found");

      const unit = payload.unit || (eq.thresholds?.[payload.parameter]?.unit ?? "");
      const log = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        equipmentId: payload.equipmentId,
        parameter: payload.parameter,
        value: Number(payload.value),
        unit,
        recordedAt: new Date().toISOString(),
        recordedBy: payload.recordedBy,
        note: payload.note || "",
      };
      mockDb.logs.unshift(log);

      const th = eq.thresholds?.[payload.parameter];
      if (th) {
        const evalRes = evaluateThreshold(th, log.value);
        if (evalRes.level !== "ok") {
          const { severity, score } = scoreBreach(th, log.value);
          const isDanger = evalRes.level === "danger";
          const title =
            evalRes.level === "danger"
              ? `${payload.parameter} above danger limit`
              : `${payload.parameter} above warning limit`;

          const alert = {
            id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
            equipmentId: payload.equipmentId,
            title,
            parameter: payload.parameter,
            value: log.value,
            unit: unit,
            severity: isDanger ? severity : severity === SEVERITY.CRITICAL ? SEVERITY.HIGH : severity,
            score: isDanger ? score : Math.min(69, score),
            status: "Open",
            createdAt: new Date().toISOString(),
            description: isDanger
              ? "Threshold breached. Create work order and dispatch maintenance."
              : "Warning threshold reached. Monitor and plan maintenance.",
          };
          mockDb.alerts.unshift(alert);
        }
      }

      // Update equipment derived health
      eq.status = deriveEquipmentHealth(mockDb.alerts, eq.id);
      eq.updatedAt = new Date().toISOString();

      return clone(log);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * List alerts.
 * @param {{ equipmentId?: string, status?: string }} params
 */
export async function listAlerts(params = {}) {
  return withFallback(
    async () => {
      const res = await apiRequest("/alerts", { query: params });
      return coerceArray(res);
    },
    async () => {
      const { equipmentId, status } = params;
      let alerts = mockDb.alerts.slice();
      if (equipmentId) alerts = alerts.filter((a) => a.equipmentId === equipmentId);
      if (status) alerts = alerts.filter((a) => a.status === status);
      return clone(alerts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * Convert an alert to a work order (and mark alert as triaged).
 * @param {{ alertId: string, assignedTo: string, dueAt: string }} payload
 */
export async function createWorkOrderFromAlert(payload) {
  return withFallback(
    async () => apiRequest("/work-orders/from-alert", { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const alert = mockDb.alerts.find((a) => a.id === payload.alertId);
      if (!alert) throw new Error("Alert not found");
      const eq = mockDb.equipment.find((e) => e.id === alert.equipmentId);

      const wo = {
        id: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
        equipmentId: alert.equipmentId,
        alertId: alert.id,
        title: `Maintain: ${eq ? eq.name : alert.equipmentId} — ${alert.title}`,
        priority: alert.severity,
        assignedTo: payload.assignedTo,
        status: "Open",
        createdAt: new Date().toISOString(),
        dueAt: payload.dueAt,
        actions: [{ at: new Date().toISOString(), by: "system", note: "Work order created from alert." }],
        parts: [],
        closure: null,
      };
      mockDb.workOrders.unshift(wo);
      alert.status = "Triaged";

      return clone(wo);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * List work orders.
 * @param {{ status?: string }} params
 */
export async function listWorkOrders(params = {}) {
  return withFallback(
    async () => {
      const res = await apiRequest("/work-orders", { query: params });
      return coerceArray(res);
    },
    async () => {
      const { status } = params;
      let wos = mockDb.workOrders.slice();
      if (status) wos = wos.filter((w) => w.status === status);
      return clone(wos).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * Update a work order (status, assignment, parts, etc).
 * @param {string} id
 * @param {any} patch
 */
export async function updateWorkOrder(id, patch) {
  return withFallback(
    async () => apiRequest(`/work-orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
    async () => {
      const wo = mockDb.workOrders.find((w) => w.id === id);
      if (!wo) throw new Error("Work order not found");
      Object.assign(wo, patch);
      wo.actions = wo.actions || [];
      if (patch.status) {
        wo.actions.unshift({ at: new Date().toISOString(), by: "system", note: `Status set to ${patch.status}.` });
      }
      return clone(wo);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * Close a work order with closure notes and update related alert/equipment health.
 * @param {{ id: string, closedBy: string, notes: string }} payload
 */
export async function closeWorkOrder(payload) {
  return withFallback(
    async () => apiRequest(`/work-orders/${encodeURIComponent(payload.id)}/close`, { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const wo = mockDb.workOrders.find((w) => w.id === payload.id);
      if (!wo) throw new Error("Work order not found");

      wo.status = "Closed";
      wo.closure = { at: new Date().toISOString(), closedBy: payload.closedBy, notes: payload.notes };
      wo.actions.unshift({ at: new Date().toISOString(), by: payload.closedBy, note: "Work order closed." });

      // Close the alert if exists
      const alert = mockDb.alerts.find((a) => a.id === wo.alertId);
      if (alert) alert.status = "Closed";

      // Update equipment health
      const eq = mockDb.equipment.find((e) => e.id === wo.equipmentId);
      if (eq) {
        eq.status = deriveEquipmentHealth(mockDb.alerts, eq.id);
        eq.updatedAt = new Date().toISOString();
      }

      return clone(wo);
    }
  );
}

/**
 * PUBLIC_INTERFACE
 * List spare parts.
 */
export async function listParts() {
  return withFallback(
    async () => apiRequest("/parts"),
    async () => clone(mockDb.parts)
  );
}

/**
 * PUBLIC_INTERFACE
 * Reserve parts for a work order (and reduce inventory).
 * @param {{ workOrderId: string, items: Array<{ partId: string, qty: number }> }} payload
 */
export async function reserveParts(payload) {
  return withFallback(
    async () => apiRequest("/parts/reserve", { method: "POST", body: JSON.stringify(payload) }),
    async () => {
      const wo = mockDb.workOrders.find((w) => w.id === payload.workOrderId);
      if (!wo) throw new Error("Work order not found");
      wo.parts = wo.parts || [];

      for (const item of payload.items) {
        const part = mockDb.parts.find((p) => p.id === item.partId);
        if (!part) throw new Error("Part not found: " + item.partId);
        const qty = Number(item.qty);
        if (qty <= 0) continue;
        if (part.stock < qty) {
          throw new Error(`Insufficient stock for ${part.name}. Available: ${part.stock}`);
        }
        part.stock -= qty;
        wo.parts.push({ partId: part.id, name: part.name, qty });
      }

      wo.actions.unshift({ at: new Date().toISOString(), by: "system", note: "Parts reserved from inventory." });
      return clone(wo);
    }
  );
}
