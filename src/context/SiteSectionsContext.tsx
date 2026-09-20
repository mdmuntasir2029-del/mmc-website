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

const CACHE_KEY = "mmc_site_sections_v1";

function readCache(): Record<SectionKey, boolean> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(sections: Record<SectionKey, boolean>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sections));
  } catch {
    // Private browsing / storage disabled — fine, just skip the cache.
  }
}

/**
 * Fetches the admin's "Site Sections" visibility once for the whole app
 * (every page/nav component used to fetch this independently before).
 *
 * An earlier version of this had App.tsx hold rendering the entire app
 * until this fetch resolved, guaranteeing a hidden section could never
 * flash visible — correct, but it serialized the fetch in front of
 * every page's own content/data fetches (e.g. the homepage photos),
 * which measurably tanked LCP (a real Lighthouse run showed the LCP
 * image's request not even starting until 2+ seconds in). Caching the
 * last-known-good result in localStorage instead gets the same "no
 * flash" outcome for the case that actually matters — a real visitor's
 * repeat page loads, including the admin reloading their own site —
 * without blocking first paint on a network round trip: the cached
 * value is read synchronously before first render, so a section
 * that's genuinely hidden is already gone from that visitor's very
 * first render, no gate required. Only a visitor's first-ever page
 * load (no cache yet) can very briefly show the default state before
 * this resolves, which is the trade-off for not blocking every load on
 * this fetch.
 */
export function SiteSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(
    () => {
      const cached = readCache();
      return cached ? { ...SECTION_DEFAULT_VISIBLE, ...cached } : SECTION_DEFAULT_VISIBLE;
    }
  );
  const [loaded, setLoaded] = useState(() => readCache() !== null);

  useEffect(() => {
    db.getSiteSections()
      .then((data) => {
        setSections((s) => {
          const next = { ...s, ...data };
          writeCache(next);
          return next;
        });
      })
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
