import React from "react";

function Navbar({ title, subtitle, status }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {subtitle ? <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{subtitle}</p> : null}
        <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
      </div>
      {status ? (
        <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)]">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-400">Status Sistem</p>
            <p className="text-sm font-semibold text-emerald-600">{status}</p>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
