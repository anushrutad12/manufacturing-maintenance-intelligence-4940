import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders dashboard title", async () => {
  // Ensure tests do not attempt real network calls; the service layer will use mockDb.
  process.env.REACT_APP_USE_MOCKS = "true";

  render(<App />);

  // Assert the main page heading, not the sidebar nav item.
  expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
});
