import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useFrdMode } from "../context/FrdModeContext";
import GlobalGoldenBuffer from "./GlobalGoldenBuffer";

const BUFFER_MS = 420;

/**
 * Shows the golden-ratio buffer overlay briefly on FRD-mode route
 * changes (the new page's own components fetch their data right after
 * mounting, so this bridges that real gap) — never on the very first
 * load, which is the WebGL pre-loader's job, and never on /admin.
 */
export default function FrdRouteBuffer() {
  const { frdMode } = useFrdMode();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [buffering, setBuffering] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!frdMode || isAdminRoute) return;
    setBuffering(true);
    const id = setTimeout(() => setBuffering(false), BUFFER_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!frdMode || isAdminRoute) return null;

  return <GlobalGoldenBuffer active={buffering} fullscreen />;
}
