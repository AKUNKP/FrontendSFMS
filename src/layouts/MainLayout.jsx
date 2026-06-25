import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { cn } from "../utils/classNames";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile drawer when clicking overlay
  const closeMobileDrawer = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-transparent">
      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0B1D3A]/95 backdrop-blur-md border-b border-white/[0.07] shadow-lg">
          {/* Hamburger */}
          <button
            type="button"
            aria-label="Buka menu"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-slate-300 hover:bg-white/[0.13] hover:text-white transition-all duration-200"
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "h-5 w-5 transition-all duration-300",
                isMobileOpen ? "opacity-0 scale-75" : "opacity-100 scale-100"
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(56,189,248,0.35)]">
              <span className="text-[9px] font-bold text-white tracking-wide">SF</span>
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-sky-400/80 leading-none">SFMS.AI</p>
              <p className="text-[12px] font-semibold text-white leading-tight">Smart Teller Monitoring</p>
            </div>
          </div>

          {/* Spacer to center brand */}
          <div className="w-9" />
        </header>
      )}

      {/* ── Mobile backdrop overlay ── */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      {isMobile ? (
        /* Mobile: drawer that slides in from left */
        <div
          className={cn(
            "fixed left-0 top-0 z-30 h-screen transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            isOpen={true}
            onToggle={closeMobileDrawer}
            isMobile={true}
            onMobileClose={closeMobileDrawer}
          />
        </div>
      ) : (
        /* Desktop: standard collapsible sidebar */
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          isMobile={false}
        />
      )}

      {/* ── Main content ── */}
      <main
        className={cn(
          "page-enter min-h-screen pb-12 transition-[margin] duration-300",
          isMobile
            ? "px-4 pt-[68px]"
            : cn(
                "px-6 pt-8 lg:px-10",
                isSidebarOpen
                  ? "lg:ml-[240px] lg:w-[calc(100%-240px)]"
                  : "lg:ml-[72px] lg:w-[calc(100%-72px)]"
              )
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
