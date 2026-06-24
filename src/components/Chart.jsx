import React, { useEffect, useState } from "react";

const PERIODS = [
  { key: "day",   label: "Hari Ini" },
  { key: "week",  label: "Minggu" },
  { key: "month", label: "Bulan" },
  { key: "year",  label: "Tahun" },
];

const PERIOD_BADGE = {
  day:   "08:00 – 17:00",
  week:  "7 Hari Terakhir",
  month: "Bulan Ini",
  year:  "Tahun Ini",
};

function Chart({
  title,
  labels = [],
  volume = [],
  smileAvg = [],
  period = "day",
  onPeriodChange,
  isEmpty,
  loading,
  tellers = [],
  selectedTellerId = "all",
  onTellerChange,
}) {
  const width   = 640;
  const height  = 260;
  const padding = 36;
  const [activeIndex, setActiveIndex] = useState(null);

  // Kosong / loading state
  const hasData = !isEmpty && labels.length > 0 && volume.length > 0;

  // Safe max — hindari divide by zero
  const maxVolume = hasData ? Math.max(...volume, 1) * 1.15 : 100;
  const step = hasData ? (width - padding * 2) / Math.max(labels.length - 1, 1) : 0;

  const toVolPt = (value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / maxVolume) * (height - padding * 2);
    return [x, y];
  };

  // smileAvg adalah 0-100, kita gambar di axis yang sama dengan scaling berbeda
  const toSmilePt = (value, index) => {
    const x = padding + index * step;
    // Scale smile (0-100) ke 30-80% dari tinggi chart agar mudah dibaca
    const normalized = value / 100;
    const y = height - padding - normalized * (height - padding * 2) * 0.7 - (height - padding * 2) * 0.05;
    return [x, y];
  };

  const buildLine = (pts) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

  const volPts   = hasData ? volume.map((v, i) => toVolPt(v, i)) : [];
  const smilePts = hasData && smileAvg.length > 0 ? smileAvg.map((v, i) => toSmilePt(v, i)) : [];

  const volumeLine = buildLine(volPts);
  const smileLine  = buildLine(smilePts);

  const volumeArea = hasData
    ? `${volumeLine} L ${volPts[volPts.length - 1][0]} ${height - padding} L ${volPts[0][0]} ${height - padding} Z`
    : "";

  useEffect(() => {
    setActiveIndex(null);
  }, [period, selectedTellerId, labels.length]);

  const selectedPoint = hasData && activeIndex !== null
    ? {
        label: labels[activeIndex],
        volume: volume[activeIndex] || 0,
        smile: smileAvg[activeIndex] ?? 0,
      }
    : null;

  const handlePointKeyDown = (event, index) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
      {/* Header — sama persis dengan aslinya, tambah filter tabs */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Analitik Harian</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTellerId}
            onChange={(event) => onTellerChange?.(event.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-slate-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            aria-label="Filter teller"
          >
            <option value="all">Semua Teller</option>
            {tellers.map((teller) => (
              <option key={teller.id_teller} value={String(teller.id_teller)}>
                {teller.nama}{teller.kode_teller ? ` - ${teller.kode_teller}` : ""}
              </option>
            ))}
          </select>
          {/* Filter period tabs */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 text-[11px] font-semibold">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => onPeriodChange?.(p.key)}
                className={`px-3 py-1.5 transition-colors ${
                  period === p.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {PERIOD_BADGE[period]}
          </span>
        </div>
      </div>

      {/* Chart body */}
      <div className="mt-6 flex gap-4">
        {/* Y-axis labels */}
        <div className="flex h-[260px] flex-col justify-between text-xs text-slate-400">
          {[4, 3, 2, 1, 0].map((tick) => (
            <span key={tick}>{Math.round((maxVolume / 4) * tick)}</span>
          ))}
        </div>

        <div className="flex-1">
          {loading ? (
            /* Loading skeleton */
            <div className="h-[260px] flex items-center justify-center">
              <div className="space-y-3 w-full px-4">
                <div className="h-2 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-4/5" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-full" />
              </div>
            </div>
          ) : !hasData ? (
            /* Empty state */
            <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-4 4 4 4-8" />
              </svg>
              <span className="text-sm">Belum ada data untuk periode ini</span>
            </div>
          ) : (
            /* SVG Chart — gaya sama persis dengan aslinya */
            <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((index) => {
                const y = padding + ((height - padding * 2) / 4) * index;
                return (
                  <line
                    key={y}
                    x1={padding} y1={y}
                    x2={width - padding} y2={y}
                    stroke="#e2e8f0" strokeDasharray="6 6"
                  />
                );
              })}

              {/* Area fill */}
              <path d={volumeArea} fill="url(#volumeGradient)" />

              {/* Volume line (biru solid) */}
              <path d={volumeLine} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />

              {/* Smile avg line (kuning putus-putus) */}
              {smilePts.length > 0 && (
                <path d={smileLine} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 8" strokeLinejoin="round" />
              )}

              {/* Dots on volume line */}
              {volPts.map(([x, y], i) => {
                const isActive = activeIndex === i;

                return (
                  <g
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`${labels[i]}: ${volume[i] || 0} transaksi, smile ${smileAvg[i] ?? 0}%`}
                    onClick={() => setActiveIndex(i)}
                    onKeyDown={(event) => handlePointKeyDown(event, i)}
                    className="cursor-pointer outline-none"
                  >
                    <circle cx={x} cy={y} r="13" fill="#2563eb" opacity="0" />
                    {isActive && <circle cx={x} cy={y} r="8" fill="#2563eb" opacity="0.16" />}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? "4.8" : "3.5"}
                      fill="#2563eb"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* X-axis labels */}
          {hasData && (
            <div className="mt-4 grid text-xs text-slate-400"
              style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
              {labels.map((label, i) => (
                <span key={i} className="text-center truncate">{label}</span>
              ))}
            </div>
          )}

          {/* Legend — sama persis dengan aslinya */}
          {selectedPoint && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{selectedPoint.label}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>
                Jumlah: <span className="font-semibold text-slate-800">{selectedPoint.volume}</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>
                Smile Avg: <span className="font-semibold text-slate-800">{selectedPoint.smile}%</span>
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Volume Transaksi
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Smile Score Avg (%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chart;
