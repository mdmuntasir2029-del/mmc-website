import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "mmc_frd_mode";

interface FrdModeContextValue {
  frdMode: boolean;
  setFrdMode: (on: boolean) => void;
}

const FrdModeContext = createContext<FrdModeContextValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A personal, this-browser-only preview toggle (not a site setting —
 * nothing here touches Supabase or affects any other visitor). Flipping
 * it in the admin panel sets/removes data-theme="frd" on <html>, which
 * the [data-theme="frd"] rules in global.css (and FrdHome.tsx on the
 * home route) key off of, and remembers the choice in localStorage so
 * it survives navigating away from /admin to look at the public pages
 * in the new skin. See the "FRD mode" plan — this mirrors the earlier
 * bizfest-preview toggle before that one was made permanent for everyone.
 */
export function FrdModeProvider({ children }: { children: ReactNode }) {
  const [frdMode, setFrdModeState] = useState<boolean>(readStored);

  useEffect(() => {
    if (frdMode) {
      document.documentElement.setAttribute("data-theme", "frd");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [frdMode]);

  function setFrdMode(on: boolean) {
    setFrdModeState(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // Private browsing / storage disabled — the toggle still works
      // for the rest of this session, it just won't persist.
    }
  }

  return (
    <FrdModeContext.Provider value={{ frdMode, setFrdMode }}>
      {children}
    </FrdModeContext.Provider>
  );
}

export function useFrdMode(): FrdModeContextValue {
  const ctx = useContext(FrdModeContext);
  if (!ctx) {
    throw new Error("useFrdMode must be used within FrdModeProvider");
  }
  return ctx;
}
