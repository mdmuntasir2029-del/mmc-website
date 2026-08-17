import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
}
