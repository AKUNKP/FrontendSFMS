import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "sfms_user";

/**
 * Mengambil data user dari localStorage.
 */
function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && parsed.user.role) {
      return parsed; // returns { user, token }
    }
    // Backward compatibility for old format
    if (parsed && parsed.role && parsed.nama) {
      return { user: parsed, token: null };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * AuthProvider — menyimpan info user yang sedang login.
 * Data user disimpan di localStorage agar tetap tersedia setelah refresh.
 */
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => loadUser());
  const user = authState?.user || null;
  const token = authState?.token || null;

  const login = useCallback((userData, token) => {
    const data = {
      id: userData.id,
      role: userData.role || "teller",
      nama: userData.nama || "User",
      username: userData.username || "",
      email: userData.email || "",
    };
    const newAuthState = { user: data, token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuthState));
    setAuthState(newAuthState);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState(null);
  }, []);

  const isLoggedIn = user !== null;
  const isAdmin = user?.role === "spv";
  const isTeller = user?.role === "teller";

  const value = useMemo(
    () => ({ user, token, login, logout, isLoggedIn, isAdmin, isTeller }),
    [user, token, login, logout, isLoggedIn, isAdmin, isTeller]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook untuk mengakses data auth dari komponen manapun.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return ctx;
}

export default AuthContext;
