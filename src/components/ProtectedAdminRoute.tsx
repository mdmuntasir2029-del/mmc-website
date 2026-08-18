import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--ink-soft)" }}>
        Checking your session...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
}
