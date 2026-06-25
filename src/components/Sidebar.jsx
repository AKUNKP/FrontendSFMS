import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../utils/classNames";
import { useAuth } from "../contexts/AuthContext";

const allMenuItems = [
  {
    label: "Dashboard",
    path: "/spv/dashboard",
    roles: ["spv"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="13" width="7" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="12" rx="1.5" />
        <rect x="13" y="18" width="8" height="3" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Live Monitoring",
    path: "/spv/live",
    roles: ["spv"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M6.3 6.3a8 8 0 1 0 11.4 11.4" />
        <path d="M17.7 6.3A8 8 0 0 1 20 12" />
      </svg>
    ),
  },
  {
    label: "Live Monitoring",
    path: "/teller/live",
    roles: ["teller"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M6.3 6.3a8 8 0 1 0 11.4 11.4" />
        <path d="M17.7 6.3A8 8 0 0 1 20 12" />
      </svg>
    ),
  },
  {
    label: "Activity Logs",
    path: "/spv/logs",
    roles: ["spv"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6M9 16h6M9 8h3" />
        <path d="M5 4h8l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  },
  {
    label: "Laporan & Analitik",
    path: "/spv/analitik",
    roles: ["spv"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-5 4 3 4-6" />
      </svg>
    ),
  },
  {
    label: "Management Akun",
    path: "/spv/teller",
    roles: ["spv"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M19 8v6M16 11h6" />
      </svg>
    ),
  },
];

function Sidebar({ isOpen, onToggle, isMobile = false, onMobileClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = allMenuItems.filter((item) => item.roles.includes(user.role));
  const roleLabel = isAdmin ? "Supervisor" : "Teller";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Initials for avatar
  const initials = user.nama
    ? user.nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 flex h-screen flex-col transition-[width] duration-300 ease-in-out",
        "bg-[#0B1D3A] border-r border-white/[0.07]",
        isMobile ? "w-[240px]" : (isOpen ? "w-[240px]" : "w-[72px]")
      )}
    >
      {/* ── Logo ── */}
      <div className={cn("relative flex items-center gap-3 px-4 pb-5", isMobile ? "pt-4" : "pt-6")}>
        {/* Logo mark */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(56,189,248,0.35)]">
          <span className="text-[11px] font-bold text-white tracking-wide">SF</span>
        </div>

        {/* Brand text */}
        <div className={cn("min-w-0 overflow-hidden transition-all duration-300", (isOpen || isMobile) ? "w-auto opacity-100" : "w-0 opacity-0")}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-sky-400/80">SFMS.AI</p>
          <p className="text-[13px] font-semibold leading-tight text-white">Smart Teller<br/>Monitoring</p>
        </div>

        {/* Mobile: X close button | Desktop: Collapse toggle */}
        {isMobile ? (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Tutup menu"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#152B50] shadow-md transition hover:bg-[#1E3A68] text-slate-300 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
            className={cn(
              "absolute -right-3.5 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#152B50] shadow-md transition hover:bg-[#1E3A68]",
              "text-slate-300 hover:text-white"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen ? "rotate-0" : "rotate-180")}
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            >
              <path d="M15 6 9 12l6 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-0.5">
        {/* Section label */}
        {(isOpen || isMobile) && (
          <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Menu Utama
          </p>
        )}

        {menuItems.map((item) => (
          <MenuItem key={`${item.path}-${item.label}`} item={item} isOpen={isOpen || isMobile} onMobileClose={isMobile ? onMobileClose : undefined} />
        ))}
      </nav>

      {/* ── Bottom: User + Logout ── */}
      <div className="shrink-0 px-3 pb-4 pt-2">
        {/* Divider */}
        <div className="mb-3 h-px bg-white/[0.06]" />

        {/* User card — compact premium style */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-3",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
          )}
        >
          {/* Subtle accent glow top-right */}
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-500/10 blur-xl" />

          <div className="relative flex items-center gap-3">
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-400 font-bold text-white",
                  "shadow-[0_4px_12px_rgba(99,102,241,0.4)]",
                  isOpen ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm"
                )}
              >
                {initials}
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B1D3A] bg-emerald-400" />
            </div>

            {/* Name & role */}
            <div
              className={cn(
                "min-w-0 overflow-hidden transition-all duration-300",
                isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}
            >
              <p className="truncate text-[13px] font-semibold leading-tight text-white">
                {user.nama || "User"}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] font-medium text-slate-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "mt-2 flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5",
            "text-[13px] font-medium text-slate-400 transition-all duration-200",
            "hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300",
            !isOpen && "justify-center px-2"
          )}
        >
          {/* Logout icon */}
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              "bg-white/[0.05] text-slate-400 group-hover:text-rose-300"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[15px] w-[15px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </span>
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

function MenuItem({ item, isOpen, onMobileClose }) {
  return (
    <NavLink
      to={item.path}
      end
      title={!isOpen ? item.label : undefined}
      onClick={onMobileClose}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          isOpen ? "" : "justify-center px-0",
          isActive
            ? "bg-white/[0.12] text-white"
            : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active left bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sky-400" />
          )}

          {/* Icon container */}
          <span className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-sky-500/20 text-sky-300"
              : "bg-white/[0.06] text-slate-400 group-hover:bg-white/[0.10] group-hover:text-slate-200"
          )}>
            <svg className="h-[17px] w-[17px]" viewBox={item.icon.props.viewBox}
              fill={item.icon.props.fill} stroke={item.icon.props.stroke}
              strokeWidth={item.icon.props.strokeWidth}
              strokeLinecap={item.icon.props.strokeLinecap}
              strokeLinejoin={item.icon.props.strokeLinejoin}
            >
              {item.icon.props.children}
            </svg>
          </span>

          {/* Label */}
          <span className={cn(
            "min-w-0 whitespace-nowrap overflow-hidden transition-all duration-300",
            isOpen ? "opacity-100 max-w-[140px]" : "opacity-0 max-w-0 pointer-events-none"
          )}>
            {item.label}
          </span>

          {/* Active dot (collapsed mode) */}
          {!isOpen && isActive && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-sky-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default Sidebar;
