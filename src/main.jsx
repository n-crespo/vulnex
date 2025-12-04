import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CveDataProvider } from "./context/CveDataContext";
import { UserDataProvider } from "./context/UserDataContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CveDataProvider>
        <UserDataProvider>
          <App />
        </UserDataProvider>
      </CveDataProvider>
    </AuthProvider>
  </StrictMode>,
);
