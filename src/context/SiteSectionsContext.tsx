import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as db from "../lib/db";
import { SECTION_DEFAULT_VISIBLE } from "../lib/types";
import type { SectionKey } from "../lib/types";

interface SiteSectionsContextValue {
  sections: Record<SectionKey, boolean>;
  loaded: boolean;
}

const SiteSectionsContext = createContext<SiteSectionsContextValue | null>(null);

/**
 * Fetches the admin's "Site Sections" visibility once for the whole app
 * (every page/nav component used to fetch this independently — several
 * duplicate requests per load, and each one raced its own "default to
 * visible" guess against the real answer). App.tsx holds rendering
 * Navbar/Routes/Footer until `loaded` is true, so a section the admin
 * has turned off can no longer flash visible for a moment on reload —
 * nothing that depends on section visibility mounts before the real
 * answer is in.
 */
export function SiteSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(
    SECTION_DEFAULT_VISIBLE
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getSiteSections()
      .then((data) => setSections((s) => ({ ...s, ...data })))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <SiteSectionsContext.Provider value={{ sections, loaded }}>
      {children}
    </SiteSectionsContext.Provider>
  );
}

export function useSiteSections(): SiteSectionsContextValue {
  const ctx = useContext(SiteSectionsContext);
  if (!ctx) {
    throw new Error("useSiteSections must be used within SiteSectionsProvider");
  }
  return ctx;
}
