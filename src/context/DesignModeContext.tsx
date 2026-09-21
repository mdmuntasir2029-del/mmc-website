import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type DesignMode = "classic" | "modern";

const STORAGE_KEY = "mmc_design_mode";

interface DesignModeContextValue {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
}

const DesignModeContext = createContext<DesignModeContextValue | null>(null);

function readStoredMode(): DesignMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "modern" ? "modern" : "classic";
  } catch {
    return "classic";
  }
}

/**
 * A personal, this-browser-only preview toggle (not a site setting —
 * nothing here touches Supabase or affects any other visitor). Flipping
 * it in the admin panel sets/removes data-theme="modern" on <html>,
 * which the [data-theme="modern"] rules in global.css key off of, and
 * remembers the choice in localStorage so it survives navigating away
 * from /admin to look at the public pages in the new skin.
 */
export function DesignModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DesignMode>(readStoredMode);

  useEffect(() => {
    if (mode === "modern") {
      document.documentElement.setAttribute("data-theme", "modern");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [mode]);

  function setMode(next: DesignMode) {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — the toggle still works
      // for the rest of this session, it just won't persist.
    }
  }

  return (
    <DesignModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DesignModeContext.Provider>
  );
}

export function useDesignMode(): DesignModeContextValue {
  const ctx = useContext(DesignModeContext);
  if (!ctx) {
    throw new Error("useDesignMode must be used within DesignModeProvider");
  }
  return ctx;
}
