import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import SectionUnavailable from "./SectionUnavailable";

/**
 * Gates an individual admin page to the one hardcoded super-admin
 * account (see is_super_admin() in schema.sql) — used inside the
 * already-authenticated /admin shell.
 */
export default function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) {
    return <SectionUnavailable />;
  }
  return <>{children}</>;
}
