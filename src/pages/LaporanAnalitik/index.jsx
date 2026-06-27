import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { apiFetch } from "../../services/apiClient";

const API = process.env.REACT_APP_API_BASE_URL;

const PERIODS = [
  { key: "today", label: "Hari Ini" },
  { key: "week",  label: "7 Hari" },
  { key: "month", label: "Bulan Ini" },
  { key: "all",   label: "Semua" },
];

function MetricCard({ title, value, delta, note, progress, barClass, deltaClass, borderClass }) {
  const isPositiveDelta = delta !== null && delta !== undefined && !String(delta).startsWith("-");
  return (
    <div className={`rounded-3xl border ${borderClass} bg-white p-5 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {delta !== null && delta !== undefined && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deltaClass}`}>
            {isPositiveDelta ? "+" : ""}{delta}
          </span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
          <div className={`h-2 rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${Math.round(Math.min(1, progress || 0) * 100)}%` }} />
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function TellerRankTable({ data, loading }) {
  if (loading) return (
    <div className="space-y-3 mt-4">
      {[1,2,3].map((i) => (
        <div key={i} className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );

  if (!data?.length) return (
    <p className="mt-4 text-sm text-slate-400 text-center py-6">Belum ada data teller untuk periode ini.</p>
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100">
            <th className="pb-3 pr-3">Rank</th>
            <th className="pb-3 pr-3">Teller</th>
            <th className="pb-3 pr-3 text-center">Sesi</th>
            <th className="pb-3 pr-3 text-center">Smile Avg</th>
            <th className="pb-3 pr-3 text-center">Avg Durasi</th>
            <th className="pb-3 text-center">Pelanggaran SLA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((r) => (
            <tr key={r.rank} className="hover:bg-slate-50/40 transition-colors">
              <td className="py-3 pr-3">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  r.rank === 1 ? "bg-amber-100 text-amber-700"
                  : r.rank === 2 ? "bg-slate-100 text-slate-600"
                  : r.rank === 3 ? "bg-orange-100 text-orange-600"
                  : "text-slate-400"
                }`}>
                  {r.rank}
                </span>
              </td>
              <td className="py-3 pr-3">
                <p className="font-medium text-slate-800">{r.nama}</p>
                <p className="text-[10px] text-slate-400">{r.kode_teller}</p>
              </td>
              <td className="py-3 pr-3 text-center font-semibold text-slate-700">{r.jumlah_sesi}</td>
              <td className="py-3 pr-3 text-center">
                <span className={`font-semibold ${r.avg_smile >= 60 ? "text-emerald-600" : r.avg_smile >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                  {r.avg_smile}%
                </span>
              </td>
              <td className="py-3 pr-3 text-center text-slate-600">{r.avg_durasi}</td>
              <td className="py-3 text-center">
                <span className={`text-xs font-semibold ${r.pelanggaran_sla > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {r.pelanggaran_sla > 0 ? `${r.pelanggaran_sla}x` : "✓"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Badge jenis file laporan
function FileBadge({ jenis }) {
  const map = {
    PDF:   "bg-rose-100 text-rose-700",
    Excel: "bg-emerald-100 text-emerald-700",
    CSV:   "bg-blue-100 text-blue-700",
    Word:  "bg-sky-100 text-sky-700",
  };
  const icon = { PDF: "📄", Excel: "📊", CSV: "📋", Word: "📝" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[jenis] || "bg-slate-100 text-slate-600"}`}>
      {icon[jenis] || "📁"} {jenis}
    </span>
  );
}

function LaporanAnalitik() {
  const [period, setPeriod]       = useState("today");
  const [stats,  setStats]         = useState(null);
  const [rank,   setRank]          = useState([]);
  const [loadStats, setLoadStats]  = useState(true);
  const [loadRank,  setLoadRank]   = useState(true);
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  // [BARU] State riwayat laporan (tabel reports)
  const [reportHistory, setReportHistory] = useState([]);
  const [loadHistory, setLoadHistory]     = useState(true);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setOpenExport(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchStats = useCallback(() => {
    setLoadStats(true);
    apiFetch(`${API}/api/laporan/stats?period=${period}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoadStats(false));
  }, [period]);

  const fetchRank = useCallback(() => {
    setLoadRank(true);
    apiFetch(`${API}/api/laporan/teller-rank?period=${period}`)
      .then((r) => r.json())
      .then((d) => setRank(d.data || []))
      .catch(console.error)
      .finally(() => setLoadRank(false));
  }, [period]);

  // [BARU] Fetch riwayat laporan dari tabel reports
  const fetchReportHistory = useCallback(() => {
    setLoadHistory(true);
    apiFetch(`${API}/api/laporan/history?limit=15`)
      .then((r) => r.json())
      .then((d) => setReportHistory(d.data || []))
      .catch(console.error)
      .finally(() => setLoadHistory(false));
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRank();
  }, [fetchStats, fetchRank]);

  // [BARU] Fetch history sekali saat halaman dibuka
  useEffect(() => {
    fetchReportHistory();
  }, [fetchReportHistory]);

  const EXPORT_OPTIONS = [
    { key: "pdf",   label: "PDF (.pdf)",   icon: "📄", endpoint: "export-pdf" },
    { key: "excel", label: "Excel (.xlsx)", icon: "📊", endpoint: "export-excel" },
    { key: "csv",   label: "CSV (.csv)",   icon: "📋", endpoint: "export-csv" },
    { key: "word",  label: "Word (.docx)", icon: "📝", endpoint: "export-word" },
  ];

  const handleExport = (endpoint) => {
    setOpenExport(false);
    apiFetch(`${API}/api/laporan/${endpoint}?period=${period}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal melakukan export laporan");
        }
        const disposition = res.headers.get("Content-Disposition");
        let filename = `laporan_${period}`;
        if (disposition && disposition.indexOf('filename=') !== -1) {
          const matches = /filename="([^"]+)"/.exec(disposition);
          if (matches && matches[1]) filename = matches[1];
        }
        const blob = await res.blob();
        return { blob, filename };
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        // Refresh history setelah export (delay 1.5s agar backend selesai INSERT)
        setTimeout(fetchReportHistory, 1500);
      })
      .catch((err) => {
        console.error("Export error:", err);
        alert("Export gagal: " + err.message);
      });
  };

  const buildDeltaClass = (d) =>
    d === null ? "" : d >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

  const getSmileColor = (score) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  const metricCards = stats ? [
    {
      title: "Total Layanan Selesai",
      value: loadStats ? "—" : stats.total_sesi.toString(),
      delta: stats.delta_sesi !== null ? `${stats.delta_sesi}%` : null,
      note:  stats.note_senyum,
      progress: stats.progress_senyum,
      barClass: "bg-blue-500",
      deltaClass: buildDeltaClass(stats.delta_sesi),
      borderClass: "border-sky-200",
    },
    {
      title: "Rata-rata Tingkat Senyum",
      value: loadStats ? "—" : `${stats.avg_smile}%`,
      delta: stats.delta_smile !== null ? `${stats.delta_smile}%` : null,
      note:  stats.note_smile,
      progress: stats.progress_smile,
      barClass: getSmileColor(stats.avg_smile),
      deltaClass: buildDeltaClass(stats.delta_smile),
      borderClass: stats.avg_smile >= 85 ? "border-emerald-200" : (stats.avg_smile >= 70 ? "border-amber-200" : "border-rose-200"),
    },
    {
      title: "Pelanggaran SLA (> 5m)",
      value: loadStats ? "—" : stats.pelanggaran_sla.toString(),
      delta: null,
      note:  stats.note_sla,
      progress: stats.total_sesi > 0 ? (stats.pelanggaran_sla / stats.total_sesi) : 0,
      barClass: stats.pelanggaran_sla > 0 ? "bg-rose-500" : "bg-emerald-500",
      deltaClass: "",
      borderClass: stats.pelanggaran_sla > 0 ? "border-rose-200" : "border-emerald-200",
    },
  ] : [];

  const periodLabel = { today: "Hari Ini", week: "7 Hari Terakhir", month: "Bulan Ini", all: "Semua Waktu" };

  return (
    <div>
      <Navbar title="Laporan & Analitik" subtitle="Analitik" />

      {/* Header */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Laporan Eksekutif</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Ringkasan performa layanan — {periodLabel[period]}
          </h3>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period filter */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 text-[11px] font-semibold">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 transition-colors ${
                  period === p.key ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setOpenExport((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(37,99,235,0.8)] hover:bg-blue-700 transition"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <path d="M13 8V2H7v6H3l7 7 7-7h-4z"/>
              </svg>
              Export
              <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${openExport ? "rotate-180" : ""}`} fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {openExport && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.3)] border border-slate-100">
                {EXPORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleExport(opt.endpoint)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-base">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Metric Cards */}
      <section className="section-enter mt-6 grid gap-5 lg:grid-cols-3">
        {loadStats
          ? [1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)] animate-pulse">
                <div className="h-3 w-28 rounded bg-slate-100" />
                <div className="mt-3 h-7 w-16 rounded bg-slate-200" />
                <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
                <div className="mt-3 h-3 w-36 rounded bg-slate-100" />
              </div>
            ))
          : metricCards.map((card) => (
              <MetricCard key={card.title} {...card} />
            ))
        }
      </section>

      {/* Statistik tambahan */}
      {stats && !loadStats && (
        <section className="section-enter mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Teller Aktif",     value: stats.jumlah_teller },
            { label: "Sesi Terdeteksi",  value: stats.terdeteksi },
            { label: "Sesi Kurang",      value: stats.kurang },
            { label: "Avg Durasi",       value: stats.avg_durasi },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-50 px-4 py-3.5 border border-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
              <p className="mt-1.5 text-xl font-bold text-slate-800">{s.value ?? "—"}</p>
            </div>
          ))}
        </section>
      )}

      {/* Teller Ranking */}
      <section className="section-enter mt-6 rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ranking</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Performa Teller — {periodLabel[period]}</h3>
          </div>
        </div>
        <TellerRankTable data={rank} loading={loadRank} />
      </section>

      {/* [BARU] Riwayat Laporan (dari tabel reports) */}
      <section className="section-enter mt-6 rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Riwayat</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Riwayat Ekspor Laporan</h3>
            <p className="mt-0.5 text-xs text-slate-400">Setiap kali laporan di-export, tercatat di sini secara otomatis.</p>
          </div>
          <button
            onClick={fetchReportHistory}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 hover:border-slate-300 transition"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Tanggal Generate</th>
                <th className="pb-3 pr-4">Jenis File</th>
                <th className="pb-3">Di-export Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadHistory ? (
                [1,2,3].map((i) => (
                  <tr key={i}>
                    {[1,2,3,4].map((j) => (
                      <td key={j} className="py-3 pr-4">
                        <div className="h-4 rounded bg-slate-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reportHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    Belum ada laporan yang di-export. Klik tombol Export di atas untuk mencoba.
                  </td>
                </tr>
              ) : reportHistory.map((r, i) => (
                <tr key={r.id_report} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pr-4 text-xs text-slate-400">{i + 1}</td>
                  <td className="py-3 pr-4 text-slate-600 text-xs">
                    {r.tanggal_generate
                      ? new Date(r.tanggal_generate).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <FileBadge jenis={r.jenis_file} />
                  </td>
                  <td className="py-3 text-slate-600 text-xs">{r.nama_user || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default LaporanAnalitik;
