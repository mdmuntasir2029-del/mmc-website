import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as auth from "../lib/auth";

interface AuthContextValue {
  isAdmin: boolean;
  email: string | null;
  signOut: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => auth.getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin: session !== null,
      email: session?.email ?? null,
      signOut: () => {
        auth.endSession();
        setSession(null);
      },
      refresh: () => setSession(auth.getSession()),
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
