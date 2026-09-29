import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

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
 *
 * The attribute is only ever applied on public routes, never on
 * /admin/* — the FRD token remap re-themes the whole public site for
 * "dark card + light text," which is the opposite of the admin panel's
 * own light-background convention (and the toggle itself lives in the
 * admin sidebar, so it needs to stay legible regardless of its own
 * state). `frdMode` itself still reflects the stored preference either
 * way — only the DOM attribute is route-gated.
 */
export function FrdModeProvider({ children }: { children: ReactNode }) {
  const [frdMode, setFrdModeState] = useState<boolean>(readStored);
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");
    if (frdMode && !isAdminRoute) {
      document.documentElement.setAttribute("data-theme", "frd");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [frdMode, location.pathname]);

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
