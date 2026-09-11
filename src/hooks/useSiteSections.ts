import { useEffect, useState } from "react";
import * as db from "../lib/db";
import { SECTION_KEYS } from "../lib/types";
import type { SectionKey } from "../lib/types";

const ALL_VISIBLE: Record<SectionKey, boolean> = SECTION_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Record<SectionKey, boolean>
);

/**
 * Which major sections/pages are currently shown, per the admin's
 * "Site Sections" settings. Defaults every key to visible until the DB
 * responds, so the common case (everything on) never flashes hidden —
 * a section only disappears once the admin has actually turned it off.
 */
export function useSiteSections() {
  const [sections, setSections] = useState(ALL_VISIBLE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getSiteSections()
      .then((data) => setSections((s) => ({ ...s, ...data })))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { sections, loaded };
}
