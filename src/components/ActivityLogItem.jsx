import React from "react";
import { cn } from "../utils/classNames";

function ActivityLogItem({ log }) {
  const status = (log.status_deteksi || "").toLowerCase();
  const isDetected = status === "terdeteksi";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nama Teller</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{log.nama_teller || "-"}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            isDetected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}
        >
          {log.status_deteksi || "-"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Waktu Selesai</p>
          <p className="mt-1 font-medium text-slate-800">{log.waktu_selesai_formatted || log.waktu_selesai}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Durasi Layanan</p>
          <p className="mt-1 font-medium text-slate-800">{log.durasi_layanan_formatted || log.durasi_layanan}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Smile Score</p>
          <p className="mt-1 font-medium text-slate-800">{log.smile_score_formatted || log.smile_score_avg}</p>
        </div>
      </div>
    </div>
  );
}

export default ActivityLogItem;
