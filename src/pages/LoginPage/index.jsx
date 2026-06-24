import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { loginUser } from "../../services/authService";
import "./LoginPage.css";

const SFMSLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7 9h4M7 12h6M7 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="15" y="9" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Username/email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(identifier.trim(), password);
      const userData = result.data;

      // Simpan data user ke context
      login(userData);

      // Redirect berdasarkan role ke URL yang berbeda
      if (userData.role === "teller") {
        navigate("/teller/live", { replace: true });
      } else if (userData.role === "spv") {
        navigate("/spv/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Gagal terhubung ke server. Pastikan backend sudah berjalan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <SFMSLogo size={26} />
          </div>
          <span className="login-logo-text">SFMS</span>
        </div>
        <h1 className="login-title">Masuk ke Dashboard</h1>
        <p className="login-subtitle">Smart Financial Monitoring System</p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label" htmlFor="login-identifier">Username atau Email</label>
            <div className="login-input-wrapper">
              <input
                id="login-identifier"
                className="login-input"
                type="text"
                placeholder="Masukkan username atau email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
              <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <input
                id="login-password"
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Memproses...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="login-back">
          <Link to="/">← Kembali ke Halaman Utama</Link>
        </div>
      </div>
    </div>
  );
}
