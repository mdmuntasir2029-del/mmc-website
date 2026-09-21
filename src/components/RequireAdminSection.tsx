import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { AdminSection } from "../lib/types";
import SectionUnavailable from "./SectionUnavailable";

/**
 * Gates an individual admin page behind a specific AdminSection
 * permission — used inside the already-authenticated /admin shell (see
 * ProtectedAdminRoute, which handles the "signed in at all" check one
 * level up). The super admin always passes.
 */
export default function RequireAdminSection({
  section,
  children,
}: {
  section: AdminSection;
  children: ReactNode;
}) {
  const { canAccess } = useAuth();
  if (!canAccess(section)) {
    return <SectionUnavailable />;
  }
  return <>{children}</>;
}
