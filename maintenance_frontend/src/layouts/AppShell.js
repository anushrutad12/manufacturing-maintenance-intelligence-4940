import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Badge } from "../components/Badge";

/**
 * PUBLIC_INTERFACE
 * Application layout with side navigation.
 * @param {{ meta: { alertsOpen: number, workOpen: number, backendMode: string } }} props
 */
export function AppShell({ meta }) {
  const navClass = ({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`.trim();

  return (
    <div className="appShell">
      <aside className="sideNav" aria-label="Primary navigation">
        <div className="brand">
          <div className="brandTitle">
            <strong>Predictive Maintenance</strong>
            <span>Alerts & Work Orders</span>
          </div>
          <Badge tone={meta.backendMode === "Mock" ? "warn" : "info"} label={meta.backendMode} />
        </div>

        <nav className="navList">
          <NavLink to="/" end className={navClass}>
            <span className="navIcon">D</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/equipment" className={navClass}>
            <span className="navIcon">E</span>
            <span>Equipment</span>
          </NavLink>
          <NavLink to="/logging" className={navClass}>
            <span className="navIcon">L</span>
            <span>Parameter Logging</span>
          </NavLink>
          <NavLink to="/alerts" className={navClass}>
            <span className="navIcon">A</span>
            <span>Alerts</span>
            <span style={{ marginLeft: "auto" }}>
              <span className="pill">{meta.alertsOpen}</span>
            </span>
          </NavLink>
          <NavLink to="/work-orders" className={navClass}>
            <span className="navIcon">W</span>
            <span>Work Orders</span>
            <span style={{ marginLeft: "auto" }}>
              <span className="pill">{meta.workOpen}</span>
            </span>
          </NavLink>
          <NavLink to="/parts" className={navClass}>
            <span className="navIcon">P</span>
            <span>Parts</span>
          </NavLink>
        </nav>

        <div className="navMeta" aria-label="System status">
          <div className="navMetaRow">
            <span>Open alerts</span>
            <strong>{meta.alertsOpen}</strong>
          </div>
          <div className="navMetaRow">
            <span>Open work orders</span>
            <strong>{meta.workOpen}</strong>
          </div>
          <div className="navMetaRow" style={{ marginBottom: 0 }}>
            <span>Mode</span>
            <strong>{meta.backendMode}</strong>
          </div>
        </div>
      </aside>

      <main className="mainArea">
        <Outlet />
      </main>
    </div>
  );
}
