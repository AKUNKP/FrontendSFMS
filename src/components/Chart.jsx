import React, { useEffect, useState } from "react";

// ── Konstanta ─────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "day",   label: "Hari Ini" },
  { key: "week",  label: "Minggu" },
  { key: "month", label: "Bulan" },
  { key: "year",  label: "Tahun" },
];
const PERIOD_LABEL = {
  day: "Analitik Harian", week: "Analitik Mingguan",
  month: "Analitik Bulanan", year: "Analitik Tahunan",
};
const PERIOD_BADGE = {
  day: "08:00–17:00", week: "7 Hari Terakhir",
  month: "Bulan Ini", year: "Tahun Ini",
};

// ── Warna ─────────────────────────────────────────────────────────────────────
const C = {
  bar:       "#3b82f6",
  barHover:  "#1d4ed8",
  line:      "#10b981",
  lineArea:  "#10b981",
  threshold: "#f59e0b",
  good:      "rgba(16,185,129,0.06)",
  bad:       "rgba(239,68,68,0.05)",
  grid:      "#f1f5f9",
  axis:      "#cbd5e1",
  text:      "#94a3b8",
  textDark:  "#1e293b",
};

// ── Smooth bezier path dari array titik ──────────────────────────────────────
function smoothPath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cpx = (x0 + x1) / 2;
    d += ` C${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }
  return d;
}

// ── Format angka ringkas ──────────────────────────────────────────────────────
const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ── Tooltip SVG ───────────────────────────────────────────────────────────────
function SvgTooltip({ x, y, label, vol, smile, svgW, padL, padR }) {
  const W = 148, H = 82;
  const tx = Math.min(Math.max(x - W / 2, padL), svgW - padR - W);
  const ty = Math.max(y - H - 16, 4);
  const smileColor = smile >= 60 ? "#10b981" : smile >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={tx + 3} y={ty + 3} width={W} height={H} rx={10} fill="rgba(0,0,0,0.12)" />
      <rect x={tx} y={ty} width={W} height={H} rx={10} fill="white" stroke="#e2e8f0" strokeWidth={1} />
      <rect x={tx} y={ty} width={W} height={24} rx={10} fill="#1e293b" />
      <rect x={tx} y={ty + 14} width={W} height={10} fill="#1e293b" />
      <text x={tx + W / 2} y={ty + 15} textAnchor="middle" fontSize={11} fontWeight="700" fill="white">{label}</text>
      <rect x={tx + 12} y={ty + 31} width={7} height={7} rx={2} fill={C.bar} />
      <text x={tx + 24} y={ty + 39} fontSize={11} fill="#475569">Sesi:</text>
      <text x={tx + W - 12} y={ty + 39} textAnchor="end" fontSize={12} fontWeight="700" fill={C.textDark}>{vol}</text>
      <circle cx={tx + 15.5} cy={ty + 55} r={4} fill={smileColor} />
      <text x={tx + 24} y={ty + 59} fontSize={11} fill="#475569">Smile avg:</text>
      <text x={tx + W - 12} y={ty + 59} textAnchor="end" fontSize={12} fontWeight="700" fill={smileColor}>{smile}%</text>
      <text x={tx + W / 2} y={ty + H - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">
        {smile >= 60 ? "✓ Di atas threshold" : "⚠ Di bawah threshold"}
      </text>
    </g>
  );
}

// ── MAIN CHART ────────────────────────────────────────────────────────────────
export default function Chart({
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
  const [hoverIdx, setHoverIdx] = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);

  useEffect(() => {
    setHoverIdx(null);
    setActiveIdx(null);
  }, [period, selectedTellerId, labels.length]);

  const hasData = !isEmpty && labels.length > 0 && volume.length > 0;

  // ── Dimensi ──────────────────────────────────────────────────────────────
  const SVG_W  = 720;
  const SVG_H  = 300;
  const PAD_T  = 24;
  const PAD_B  = 38;
  const PAD_L  = 50;
  const PAD_R  = 50;
  const PLOT_W = SVG_W - PAD_L - PAD_R;
  const PLOT_H = SVG_H - PAD_T - PAD_B;
  const THRESH = 60;

  const n      = hasData ? labels.length : 0;
  const maxVol = hasData ? Math.max(...volume, 1) * 1.25 : 10;
  const BAR_W  = Math.max(6, Math.min(32, (PLOT_W / Math.max(n, 1)) * 0.50));

  const xOf    = (i) => n <= 1 ? PAD_L + PLOT_W / 2 : PAD_L + (PLOT_W / (n - 1)) * i;
  const yVol   = (v) => PAD_T + PLOT_H - (v / maxVol) * PLOT_H;
  const ySmile = (s) => PAD_T + PLOT_H - (s / 100) * PLOT_H;
  const threshY = ySmile(THRESH);

  // Peak index
  const peakIdx = hasData ? volume.indexOf(Math.max(...volume)) : -1;

  // Smile bezier path
  const smilePts = hasData && smileAvg.length > 0
    ? smileAvg.map((s, i) => [xOf(i), ySmile(s)])
    : [];
  const linePath = smoothPath(smilePts);
  const areaPath = smilePts.length > 1
    ? `${linePath} L${smilePts[smilePts.length - 1][0]},${PAD_T + PLOT_H} L${smilePts[0][0]},${PAD_T + PLOT_H} Z`
    : "";

  // Titik fokus
  const focusIdx = hoverIdx !== null ? hoverIdx : activeIdx;
  const focused  = focusIdx !== null && hasData ? {
    label:  labels[focusIdx],
    volume: volume[focusIdx] || 0,
    smile:  smileAvg[focusIdx] ?? 0,
    x: xOf(focusIdx),
    y: smileAvg[focusIdx] != null ? ySmile(smileAvg[focusIdx]) : PAD_T,
  } : null;

  const volTicks   = Array.from({ length: 5 }, (_, i) => Math.round(maxVol / 4 * i));
  const smileTicks = [0, 25, 50, 75, 100];
  const skipX      = n > 16 ? Math.ceil(n / 12) : 1;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]">

      {/* ── HEADER TERANG ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              {PERIOD_LABEL[period]}
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter teller */}
            <select
              value={selectedTellerId}
              onChange={(e) => onTellerChange?.(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Semua Teller</option>
              {tellers.map((t) => (
                <option key={t.id_teller} value={String(t.id_teller)}>
                  {t.nama}{t.kode_teller ? ` — ${t.kode_teller}` : ""}
                </option>
              ))}
            </select>

            {/* Period tabs */}
            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-[11px] font-semibold bg-white">
              {PERIODS.map((p) => (
                <button key={p.key} onClick={() => onPeriodChange?.(p.key)}
                  className={`px-3 py-1.5 transition-colors ${
                    period === p.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
              {PERIOD_BADGE[period]}
            </span>
          </div>
        </div>
      </div>

      {/* ── CHART AREA ── */}
      <div className="bg-white px-4 pb-4 pt-4">
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="w-full space-y-3 px-6">
              {[1, .8, 1, .7, 1].map((w, i) => (
                <div key={i} className="h-1.5 animate-pulse rounded bg-slate-100"
                  style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="h-14 w-14 text-slate-200"
              fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-8" />
            </svg>
            <p className="text-sm font-semibold text-slate-400">Belum ada data untuk periode ini</p>
            <p className="text-xs text-slate-300">Coba pilih periode yang berbeda</p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="h-[300px] w-full select-none"
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="cg_bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.bar} stopOpacity=".9" />
                  <stop offset="100%" stopColor={C.bar} stopOpacity=".55" />
                </linearGradient>
                <linearGradient id="cg_barH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.barHover} stopOpacity="1" />
                  <stop offset="100%" stopColor={C.barHover} stopOpacity=".7" />
                </linearGradient>
                <linearGradient id="cg_area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.lineArea} stopOpacity=".22" />
                  <stop offset="80%"  stopColor={C.lineArea} stopOpacity=".04" />
                  <stop offset="100%" stopColor={C.lineArea} stopOpacity="0" />
                </linearGradient>
                <clipPath id="cg_clip">
                  <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
                </clipPath>
              </defs>

              {/* ── Zona warna ── */}
              <rect x={PAD_L} y={threshY} width={PLOT_W} height={PAD_T + PLOT_H - threshY}
                fill={C.bad} clipPath="url(#cg_clip)" />
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={threshY - PAD_T}
                fill={C.good} clipPath="url(#cg_clip)" />

              {/* ── Grid horizontal ── */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = PAD_T + PLOT_H * (1 - frac);
                return (
                  <line key={i} x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y}
                    stroke={C.grid} strokeWidth={frac === 0 ? 1.5 : 1}
                    strokeDasharray={frac === 0 ? "0" : "3 5"} />
                );
              })}

              {/* ── Threshold line ── */}
              <line x1={PAD_L} y1={threshY} x2={PAD_L + PLOT_W} y2={threshY}
                stroke={C.threshold} strokeWidth={1.5} strokeDasharray="5 4" opacity=".8" />
              <rect x={PAD_L + PLOT_W - 66} y={threshY - 14} width={64} height={13}
                rx={4} fill={C.threshold} opacity=".15" />
              <text x={PAD_L + PLOT_W - 34} y={threshY - 4} textAnchor="middle"
                fontSize={9} fontWeight="600" fill={C.threshold}>Threshold 60%</text>

              {/* ── Y-axis kiri (volume) ── */}
              <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + PLOT_H}
                stroke={C.axis} strokeWidth={1} />
              {volTicks.map((tick, i) => {
                const y = PAD_T + PLOT_H * (1 - i / 4);
                return (
                  <text key={i} x={PAD_L - 8} y={y + 4}
                    textAnchor="end" fontSize={10} fill={C.text}>{fmt(tick)}</text>
                );
              })}
              <text x={14} y={PAD_T + PLOT_H / 2}
                transform={`rotate(-90,14,${PAD_T + PLOT_H / 2})`}
                textAnchor="middle" fontSize={10} fontWeight="700" fill={C.bar}>Sesi</text>

              {/* ── Y-axis kanan (smile %) ── */}
              <line x1={PAD_L + PLOT_W} y1={PAD_T} x2={PAD_L + PLOT_W} y2={PAD_T + PLOT_H}
                stroke={C.axis} strokeWidth={1} />
              {smileTicks.map((pct, i) => {
                const y = PAD_T + PLOT_H * (1 - pct / 100);
                return (
                  <text key={i} x={PAD_L + PLOT_W + 8} y={y + 4}
                    textAnchor="start" fontSize={10} fill={C.text}>{pct}%</text>
                );
              })}
              <text x={SVG_W - 14} y={PAD_T + PLOT_H / 2}
                transform={`rotate(90,${SVG_W - 14},${PAD_T + PLOT_H / 2})`}
                textAnchor="middle" fontSize={10} fontWeight="700" fill={C.line}>Smile %</text>

              {/* ── Bars volume ── */}
              {volume.map((v, i) => {
                const x       = xOf(i);
                const bh      = (v / maxVol) * PLOT_H;
                const by      = PAD_T + PLOT_H - bh;
                const isFocus = hoverIdx === i || activeIdx === i;
                const isPeak  = i === peakIdx;
                const zoneW   = PLOT_W / n;

                return (
                  <g key={i}>
                    {/* Hover zone */}
                    <rect x={x - zoneW / 2} y={PAD_T} width={zoneW} height={PLOT_H}
                      fill="transparent" style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoverIdx(i)}
                      onClick={() => setActiveIdx(activeIdx === i ? null : i)} />
                    {/* Bar shadow */}
                    {isFocus && (
                      <rect x={x - BAR_W / 2 + 2} y={by + 2}
                        width={BAR_W} height={Math.max(bh, 2)}
                        rx={5} fill={C.barHover} opacity=".18" />
                    )}
                    {/* Bar */}
                    <rect x={x - BAR_W / 2} y={by}
                      width={BAR_W} height={Math.max(bh, 2)} rx={5}
                      fill={isFocus ? "url(#cg_barH)" : "url(#cg_bar)"}
                      style={{ transition: "fill .15s" }} />
                    {/* Badge PEAK */}
                    {isPeak && v > 0 && (
                      <g>
                        <rect x={x - 16} y={by - 20} width={32} height={14} rx={4} fill="#1e293b" />
                        <text x={x} y={by - 10} textAnchor="middle"
                          fontSize={9} fontWeight="700" fill="white">PEAK</text>
                      </g>
                    )}
                    {/* Nilai hover */}
                    {isFocus && !isPeak && v > 0 && (
                      <text x={x} y={by - 6} textAnchor="middle"
                        fontSize={10} fontWeight="700" fill={C.barHover}>{v}</text>
                    )}
                  </g>
                );
              })}

              {/* ── Smile area ── */}
              {areaPath && (
                <path d={areaPath} fill="url(#cg_area)" clipPath="url(#cg_clip)" />
              )}
              {/* ── Smile line ── */}
              {linePath && (
                <path d={linePath} fill="none" stroke={C.line}
                  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  clipPath="url(#cg_clip)" />
              )}

              {/* ── Dots smile ── */}
              {smilePts.map(([x, y], i) => {
                const isFocus  = hoverIdx === i || activeIdx === i;
                const sc       = smileAvg[i];
                const dotColor = sc >= THRESH ? C.line : sc >= 40 ? "#f59e0b" : "#ef4444";
                return (
                  <g key={i} style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoverIdx(i)}
                    onClick={() => setActiveIdx(activeIdx === i ? null : i)}>
                    {isFocus && <circle cx={x} cy={y} r={9} fill={dotColor} opacity=".15" />}
                    <circle cx={x} cy={y} r={isFocus ? 5 : 3.5}
                      fill={dotColor} stroke="white" strokeWidth={2}
                      style={{ transition: "r .12s" }} />
                  </g>
                );
              })}

              {/* ── Garis vertikal hover ── */}
              {focused && (
                <line x1={focused.x} y1={PAD_T} x2={focused.x} y2={PAD_T + PLOT_H}
                  stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" opacity=".5" />
              )}

              {/* ── Tooltip ── */}
              {focused && (
                <SvgTooltip
                  x={focused.x} y={focused.y}
                  label={focused.label} vol={focused.volume} smile={focused.smile}
                  svgW={SVG_W} padL={PAD_L} padR={PAD_R}
                />
              )}

              {/* ── Label X-axis ── */}
              {labels.map((lbl, i) => {
                if (i % skipX !== 0 && i !== n - 1) return null;
                const x       = xOf(i);
                const isFocus = hoverIdx === i || activeIdx === i;
                return (
                  <text key={i} x={x} y={SVG_H - 8} textAnchor="middle"
                    fontSize={isFocus ? 11 : 10}
                    fontWeight={isFocus ? "700" : "400"}
                    fill={isFocus ? C.textDark : C.text}>{lbl}</text>
                );
              })}
            </svg>

            {/* ── Legend ── */}
            <div className="mt-1 flex flex-wrap items-center gap-5 border-t border-slate-100 px-2 pt-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: C.bar }} />
                Volume Sesi (skala kiri)
              </span>
              <span className="flex items-center gap-2">
                <svg width="20" height="8">
                  <path d="M0 4 C5,1 10,7 20,4" stroke={C.line} strokeWidth="2" fill="none" />
                </svg>
                Smile Score Avg % (skala kanan)
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-0 w-5 border-t-2 border-dashed"
                  style={{ borderColor: C.threshold }} />
                Threshold 60%
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm"
                  style={{ background: C.good, border: "1px solid #bbf7d0" }} />
                Zona Baik (≥60%)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm"
                  style={{ background: C.bad, border: "1px solid #fecaca" }} />
                Zona Perhatian (&lt;60%)
              </span>
              <span className="ml-auto text-[10px] italic text-slate-300">
                Hover / klik untuk detail
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
