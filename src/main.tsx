import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/global.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { SiteSectionsProvider } from "./context/SiteSectionsContext";
import { DesignModeProvider } from "./context/DesignModeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteSectionsProvider>
          <DesignModeProvider>
            <App />
          </DesignModeProvider>
        </SiteSectionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
