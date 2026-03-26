import { HEALTH, SEVERITY } from "../services/mockDb";

/**
 * PUBLIC_INTERFACE
 * Calculate severity and score based on breach magnitude and recency.
 * @param {{ warn: number, danger: number }} threshold
 * @param {number} value
 * @returns {{ severity: string, score: number }}
 */
export function scoreBreach(threshold, value) {
  const { warn, danger } = threshold;
  const overWarn = Math.max(0, value - warn);
  const overDanger = Math.max(0, value - danger);

  // Severity bands
  let severity = SEVERITY.LOW;
  if (value >= danger) severity = SEVERITY.HIGH;
  if (value >= danger * 1.05) severity = SEVERITY.CRITICAL;
  if (value >= warn && value < danger) severity = SEVERITY.MEDIUM;

  // Score: relative to ranges, capped 0-100
  const warnRange = Math.max(1e-6, danger - warn);
  const scaled = value < warn ? 0 : value < danger ? (overWarn / warnRange) * 60 : 70 + Math.min(30, (overDanger / Math.max(1e-6, danger)) * 30);
  const score = Math.max(0, Math.min(100, Math.round(scaled)));

  return { severity, score };
}

/**
 * PUBLIC_INTERFACE
 * Determine if a value breaches warn/danger.
 * @param {{ warn: number, danger: number }} threshold
 * @param {number} value
 * @returns {{ level: "ok"|"warn"|"danger" }}
 */
export function evaluateThreshold(threshold, value) {
  if (value >= threshold.danger) return { level: "danger" };
  if (value >= threshold.warn) return { level: "warn" };
  return { level: "ok" };
}

/**
 * PUBLIC_INTERFACE
 * Derive equipment health status from open alerts for that equipment.
 * @param {Array<{ equipmentId: string, severity: string, status: string }>} alerts
 * @param {string} equipmentId
 * @returns {string} HEALTH enum
 */
export function deriveEquipmentHealth(alerts, equipmentId) {
  const open = alerts.filter((a) => a.equipmentId === equipmentId && a.status !== "Closed");
  if (open.some((a) => a.severity === SEVERITY.CRITICAL)) return HEALTH.CRITICAL;
  if (open.some((a) => a.severity === SEVERITY.HIGH || a.severity === SEVERITY.MEDIUM)) return HEALTH.AT_RISK;
  return HEALTH.HEALTHY;
}

/**
 * PUBLIC_INTERFACE
 * Map severity to badge style token for UI.
 * @param {string} severity
 * @returns {"danger"|"warn"|"info"|"success"}
 */
export function severityToTone(severity) {
  if (severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH) return "danger";
  if (severity === SEVERITY.MEDIUM) return "warn";
  if (severity === SEVERITY.LOW) return "info";
  return "success";
}
