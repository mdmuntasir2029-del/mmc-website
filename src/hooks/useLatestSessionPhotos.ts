import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

/** Fetched once and shared: both the pi-wave (which needs the count to
 * size itself) and the photo layer (which needs the actual photos) read
 * from the same result instead of fetching independently. */
export function useLatestSessionPhotos() {
  const [label, setLabel] = useState("");
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getLatestSessionPhotos()
      .then((data) => {
        if (data) {
          setLabel(data.label);
          setPhotos(data.photos);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { label, photos, loaded };
}
