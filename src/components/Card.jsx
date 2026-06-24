import React from "react";
import { cn } from "../utils/classNames";

const toneStyles = {
  sky: "bg-sky-100 text-sky-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
};

function Card({ title, value, note, icon, accent, tone = "sky" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)] transition hover:-translate-y-1",
        accent
      )}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/60" />
      <div className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl", toneStyles[tone])}>
        {icon}
      </div>
      <div className="relative mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </div>
    </div>
  );
}

export default Card;
