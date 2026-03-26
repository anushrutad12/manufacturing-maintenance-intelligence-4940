/**
 * In-memory mock "database" with realistic sample data.
 * Used by the service layer when REACT_APP_USE_MOCKS=true or when backend endpoints are unavailable.
 */

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export const SEVERITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const HEALTH = {
  HEALTHY: "Healthy",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};

const nowIso = () => new Date().toISOString();

export const mockDb = {
  equipment: [
    {
      id: "EQ-1001",
      name: "CNC Mill #3",
      area: "Machining",
      model: "HAAS VF-2",
      status: HEALTH.AT_RISK,
      updatedAt: nowIso(),
      thresholds: {
        vibration: { warn: 5.0, danger: 7.0, unit: "mm/s" },
        temperature: { warn: 75, danger: 90, unit: "°C" },
        pressure: { warn: 2.2, danger: 2.8, unit: "bar" },
      },
    },
    {
      id: "EQ-1002",
      name: "Hydraulic Press #1",
      area: "Forming",
      model: "Schuler H-200",
      status: HEALTH.HEALTHY,
      updatedAt: nowIso(),
      thresholds: {
        vibration: { warn: 4.0, danger: 6.0, unit: "mm/s" },
        temperature: { warn: 70, danger: 85, unit: "°C" },
        pressure: { warn: 2.4, danger: 3.0, unit: "bar" },
      },
    },
    {
      id: "EQ-1003",
      name: "Conveyor Line A",
      area: "Packaging",
      model: "Interroll MK-9",
      status: HEALTH.HEALTHY,
      updatedAt: nowIso(),
      thresholds: {
        vibration: { warn: 3.5, danger: 5.5, unit: "mm/s" },
        temperature: { warn: 60, danger: 75, unit: "°C" },
        pressure: { warn: 1.8, danger: 2.3, unit: "bar" },
      },
    },
  ],
  logs: [
    {
      id: "LOG-9001",
      equipmentId: "EQ-1001",
      parameter: "vibration",
      value: 7.2,
      unit: "mm/s",
      recordedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      recordedBy: "sensor",
      note: "Spindle vibration spike detected.",
    },
    {
      id: "LOG-9002",
      equipmentId: "EQ-1002",
      parameter: "temperature",
      value: 66,
      unit: "°C",
      recordedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      recordedBy: "operator",
      note: "Routine shift check.",
    },
    {
      id: "LOG-9003",
      equipmentId: "EQ-1001",
      parameter: "temperature",
      value: 92,
      unit: "°C",
      recordedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      recordedBy: "sensor",
      note: "Coolant temp elevated.",
    },
  ],
  alerts: [
    {
      id: "AL-7001",
      equipmentId: "EQ-1001",
      title: "Vibration threshold breached",
      parameter: "vibration",
      value: 7.2,
      unit: "mm/s",
      severity: SEVERITY.CRITICAL,
      score: 92,
      status: "Open",
      createdAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      description: "Vibration exceeded danger threshold. Inspect spindle bearings, check tool balance.",
    },
    {
      id: "AL-7002",
      equipmentId: "EQ-1001",
      title: "Temperature above danger limit",
      parameter: "temperature",
      value: 92,
      unit: "°C",
      severity: SEVERITY.HIGH,
      score: 78,
      status: "Open",
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      description: "Temperature exceeds danger threshold. Verify coolant flow, check heat exchanger.",
    },
  ],
  workOrders: [
    {
      id: "WO-3001",
      equipmentId: "EQ-1001",
      alertId: "AL-7001",
      title: "Inspect CNC spindle bearing",
      priority: SEVERITY.CRITICAL,
      assignedTo: "Maintenance Team A",
      status: "In Progress",
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      actions: [
        { at: new Date(Date.now() - 1000 * 60 * 38).toISOString(), by: "system", note: "Work order created from alert." },
        { at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), by: "planner", note: "Assigned to Maintenance Team A." },
      ],
      parts: [
        { partId: "PT-2001", name: "Spindle bearing kit", qty: 1 },
        { partId: "PT-2003", name: "Vibration sensor mount", qty: 1 },
      ],
      closure: null,
    },
  ],
  parts: [
    { id: "PT-2001", name: "Spindle bearing kit", stock: 2, reorderPoint: 1, location: "Aisle 2 / Bin 11" },
    { id: "PT-2002", name: "Hydraulic seal pack", stock: 0, reorderPoint: 2, location: "Aisle 1 / Bin 03" },
    { id: "PT-2003", name: "Vibration sensor mount", stock: 5, reorderPoint: 2, location: "Aisle 3 / Bin 02" },
    { id: "PT-2004", name: "Coolant hose 1/2in", stock: 1, reorderPoint: 3, location: "Aisle 4 / Bin 07" },
  ],
  _uid: uid,
};
