import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { checkIsAdmin, checkIsSuperAdmin, getMyAdminPermissions } from "../lib/auth";
import type { AdminSection } from "../lib/types";

interface AuthContextValue {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Which admin sections this admin can reach — irrelevant (and not
   *  populated) for the super admin, who can reach every section
   *  regardless of what's granted; check canAccess() instead of this
   *  directly. */
  permissions: AdminSection[];
  /** True if this admin should see/reach the given admin-panel section —
   *  the super admin always can, everyone else only if granted. */
  canAccess: (section: AdminSection) => boolean;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncAdmin(nextSession: Session | null) {
      if (!nextSession) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setPermissions([]);
        }
        return;
      }
      const admin = await checkIsAdmin();
      if (cancelled) return;
      setIsAdmin(admin);
      if (!admin) {
        setIsSuperAdmin(false);
        setPermissions([]);
        return;
      }
      const [superAdmin, perms] = await Promise.all([
        checkIsSuperAdmin(),
        getMyAdminPermissions(),
      ]);
      if (cancelled) return;
      setIsSuperAdmin(superAdmin);
      setPermissions(perms as AdminSection[]);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await syncAdmin(data.session);
      if (!cancelled) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        syncAdmin(newSession).finally(() => {
          if (!cancelled) setLoading(false);
        });
      }
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin,
      isSuperAdmin,
      permissions,
      canAccess: (section: AdminSection) =>
        isSuperAdmin || permissions.includes(section),
      email: session?.user?.email ?? null,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isAdmin, isSuperAdmin, permissions, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
