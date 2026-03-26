import React, { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import "./App.css";

import { createAppQueryClient } from "./state/queryClient";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { LoggingPage } from "./pages/LoggingPage";
import { AlertsPage } from "./pages/AlertsPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { PartsPage } from "./pages/PartsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { listAlerts, listWorkOrders } from "./services/maintenanceService";

const queryClient = createAppQueryClient();

function ShellWrapper() {
  const alertsQ = useQuery({ queryKey: ["alerts"], queryFn: () => listAlerts({ status: "Open" }) });
  const workQ = useQuery({ queryKey: ["workOrders"], queryFn: () => listWorkOrders({}) });

  const meta = useMemo(() => {
    const alertsOpen = (alertsQ.data || []).length;
    const workOpen = (workQ.data || []).filter((w) => w.status !== "Closed").length;
    const backendMode = String(process.env.REACT_APP_USE_MOCKS || "").toLowerCase() === "true" ? "Mock" : "Auto";
    return { alertsOpen, workOpen, backendMode };
  }, [alertsQ.data, workQ.data]);

  return <AppShell meta={meta} />;
}

/**
 * PUBLIC_INTERFACE
 * Main application component (routes + providers).
 */
function App() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <ShellWrapper />,
          errorElement: <NotFoundPage />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: "equipment", element: <EquipmentPage /> },
            { path: "logging", element: <LoggingPage /> },
            { path: "alerts", element: <AlertsPage /> },
            { path: "work-orders", element: <WorkOrdersPage /> },
            { path: "parts", element: <PartsPage /> },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ]),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
