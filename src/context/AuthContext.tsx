import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { checkIsAdmin } from "../lib/auth";

interface AuthContextValue {
  isAdmin: boolean;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncAdmin(nextSession: Session | null) {
      const admin = nextSession ? await checkIsAdmin() : false;
      if (!cancelled) setIsAdmin(admin);
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
      email: session?.user?.email ?? null,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
