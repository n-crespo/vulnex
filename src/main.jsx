import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CveDataProvider } from "./context/CveDataContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CveDataProvider>
        <App />
      </CveDataProvider>
    </AuthProvider>
  </StrictMode>,
);
