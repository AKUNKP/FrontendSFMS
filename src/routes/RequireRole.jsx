import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * RequireRole — komponen proteksi route berdasarkan role.
 *
 * Props:
 * - allowed: array role yang diperbolehkan, mis. ["spv"]
 * - fallback: path redirect jika role tidak sesuai, default "/dashboard/live"
 * - children: komponen halaman yang dilindungi
 */
function RequireRole({ allowed = [], fallback = "/dashboard/live", children }) {
  const { user } = useAuth();

  if (!allowed.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default RequireRole;
