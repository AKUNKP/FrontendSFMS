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
    if (parsed && parsed.role && parsed.nama) {
      return parsed;
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
  const [user, setUser] = useState(() => loadUser());

  const login = useCallback((userData) => {
    const data = {
      id: userData.id,
      role: userData.role || "teller",
      nama: userData.nama || "User",
      username: userData.username || "",
      email: userData.email || "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const isLoggedIn = user !== null;
  const isAdmin = user?.role === "spv";
  const isTeller = user?.role === "teller";

  const value = useMemo(
    () => ({ user, login, logout, isLoggedIn, isAdmin, isTeller }),
    [user, login, logout, isLoggedIn, isAdmin, isTeller]
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
