import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * RequireAuth — komponen proteksi route.
 * Jika user belum login, redirect ke halaman login.
 */
function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RequireAuth;
