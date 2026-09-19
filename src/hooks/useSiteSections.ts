import { useEffect, useState } from "react";
import * as db from "../lib/db";
import { SECTION_DEFAULT_VISIBLE } from "../lib/types";

/**
 * Which major sections/pages are currently shown, per the admin's
 * "Site Sections" settings. Defaults to SECTION_DEFAULT_VISIBLE until the
 * DB responds, so the common case (everything on) never flashes hidden —
 * a section only disappears once the admin has actually turned it off (or,
 * for a section deliberately defaulted off, it just stays off until they
 * turn it on).
 */
export function useSiteSections() {
  const [sections, setSections] = useState(SECTION_DEFAULT_VISIBLE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getSiteSections()
      .then((data) => setSections((s) => ({ ...s, ...data })))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { sections, loaded };
}
