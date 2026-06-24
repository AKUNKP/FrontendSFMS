import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Card from "../../components/Card";
import Chart from "../../components/Chart";

const API = process.env.REACT_APP_API_BASE_URL;

// ─── Icon set (sama persis dengan sebelumnya) ─────────────────────────────────
const statIcons = {
  sky: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M4 20a8 8 0 0 1 16 0" />
      <path d="M20 11h2" />
    </svg>
  ),
  emerald: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  amber: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01" />
      <path d="M15 9.5h.01" />
    </svg>
  ),
  purple: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 12a4 4 0 1 0-4-4" />
      <path d="M4 21a8 8 0 0 1 13.5-5.5" />
      <circle cx="18" cy="14" r="3" />
    </svg>
  ),
};

// ─── TrendBadge ───────────────────────────────────────────────────────────────
function TrendBadge({ direction, delta, label, invert = false }) {
  // Untuk durasi: naik = buruk (warna merah), jadi invert arahnya
  const effectiveDir = invert
    ? direction === "naik" ? "turun" : direction === "turun" ? "naik" : "stabil"
    : direction;

  const cfg = {
    naik:   { icon: "↑", cls: "bg-emerald-400/30 text-emerald-200 ring-1 ring-emerald-300/30" },
    turun:  { icon: "↓", cls: "bg-red-400/30 text-red-200 ring-1 ring-red-300/30" },
    stabil: { icon: "→", cls: "bg-white/15 text-white/60" },
  };
  const { cls } = cfg[effectiveDir] || cfg.stabil;
  const rawIcon = direction === "naik" ? "↑" : direction === "turun" ? "↓" : "→";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {rawIcon} {label}{delta > 0 ? `: ${delta}${label === "Smile" ? "%" : " mnt"}` : ""}
    </span>
  );
}

// ─── AI Insights panel ────────────────────────────────────────────────────────
function AIInsights({ insights, loading }) {
  const operational = loading
    ? "Memuat data..."
    : insights?.operational || "Belum ada data sesi untuk dianalisis.";
  const interaction = loading
    ? "Memuat data..."
    : insights?.interaction || "Mulai monitoring untuk melihat analisis interaksi.";

  const trend       = insights?.trend       || null;
  const worstTeller = insights?.worstTeller || null;
  const summary     = insights?.summary     || null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-[0_22px_50px_-30px_rgba(37,99,235,0.7)]">
      {/* Decorative blobs */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3a7 7 0 0 0-4 12.7V21h8v-5.3A7 7 0 0 0 12 3Z" />
              <path d="M9 12h6" />
              <path d="M9.5 16h5" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">AI Insights</p>
            <h3 className="text-lg font-semibold">Wawasan Sistem</h3>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          {/* ── Rekomendasi Operasional ── */}
          <div className="rounded-2xl bg-white/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Rekomendasi Operasional
            </p>
            <p className={`mt-2 leading-relaxed ${loading ? "animate-pulse opacity-60" : ""}`}>
              {operational}
            </p>
          </div>

          {/* ── Analisis Interaksi ── */}
          <div className="rounded-2xl bg-white/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Analisis Interaksi
            </p>
            <p className={`mt-2 leading-relaxed ${loading ? "animate-pulse opacity-60" : ""}`}>
              {interaction}
            </p>
          </div>

          {/* ── Tren 7 Hari (tampil hanya bila ada data tren) ── */}
          {!loading && trend && (
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Tren vs 7 Hari Sebelumnya
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <TrendBadge
                  direction={trend.smile}
                  delta={trend.smileDelta}
                  label="Smile"
                  invert={false}
                />
                <TrendBadge
                  direction={trend.durasi}
                  delta={trend.durasiDelta}
                  label="Durasi"
                  invert={true}
                />
              </div>
              {trend.smile === "stabil" && trend.durasi === "stabil" && (
                <p className="mt-2 text-xs text-white/50">
                  Belum cukup data periode sebelumnya untuk menghitung tren.
                </p>
              )}
            </div>
          )}

          {/* ── Perlu Coaching (tampil hanya bila ada worst teller) ── */}
          {!loading && worstTeller && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                ⚠ Perlu Coaching
              </p>
              <p className="mt-1 leading-relaxed text-white/90">{worstTeller}</p>
            </div>
          )}

          {/* ── Ringkasan ── */}
          {!loading && summary && (
            <div className="rounded-xl border-l-2 border-white/40 bg-white/10 px-4 py-3 text-xs italic text-white/80">
              {summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats]       = useState(null);
  const [chartData, setChartData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [chartTellers, setChartTellers] = useState([]);
  const [period, setPeriod]     = useState("day");
  const [selectedTellerId, setSelectedTellerId] = useState("all");
  const [loadStats, setLoadStats]     = useState(true);
  const [loadChart, setLoadChart]     = useState(true);
  const [loadInsights, setLoadInsights] = useState(true);

  // ── Fetch KPI stats ────────────────────────────────────────────────────────
  const fetchStats = useCallback(() => {
    setLoadStats(true);
    fetch(`${API}/api/dashboard/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoadStats(false));
  }, []);

  // ── Fetch chart data ───────────────────────────────────────────────────────
  const fetchChart = useCallback((p, tellerId = "all") => {
    setLoadChart(true);
    const params = new URLSearchParams({ period: p });
    if (tellerId && tellerId !== "all") {
      params.set("tellerId", tellerId);
    }

    fetch(`${API}/api/dashboard/chart?${params.toString()}`)
      .then((r) => r.json())
      .then(setChartData)
      .catch(console.error)
      .finally(() => setLoadChart(false));
  }, []);

  const fetchChartTellers = useCallback(() => {
    fetch(`${API}/api/dashboard/chart-tellers`)
      .then((r) => r.json())
      .then((data) => setChartTellers(Array.isArray(data?.data) ? data.data : []))
      .catch(console.error);
  }, []);

  // ── Fetch AI insights ──────────────────────────────────────────────────────
  const fetchInsights = useCallback(() => {
    setLoadInsights(true);
    fetch(`${API}/api/dashboard/insights`)
      .then((r) => r.json())
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoadInsights(false));
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchInsights();
    fetchChartTellers();
  }, [fetchStats, fetchInsights, fetchChartTellers]);

  // Chart load on period / teller change
  useEffect(() => {
    fetchChart(period, selectedTellerId);
  }, [period, selectedTellerId, fetchChart]);

  // Auto-refresh setiap 60 detik
  useEffect(() => {
    const t = setInterval(() => {
      fetchStats();
      fetchInsights();
      if (period === "day") fetchChart("day", selectedTellerId);
    }, 60000);
    return () => clearInterval(t);
  }, [period, selectedTellerId, fetchStats, fetchInsights, fetchChart]);

  // ── Build stat cards dari data real ───────────────────────────────────────
  const statCards = stats
    ? [
        {
          title: "Total Sesi Hari Ini",
          value: loadStats ? "—" : stats.totalSesi.toString(),
          note: loadStats ? "Memuat..." : stats.sesiNote,
          accent: "from-sky-50 via-white to-white",
          tone: "sky",
        },
        {
          title: "Rata-rata Waktu Layanan",
          value: loadStats ? "—" : stats.avgDurasi,
          note: loadStats ? "Memuat..." : stats.durasiNote,
          accent: "from-emerald-50 via-white to-white",
          tone: "emerald",
        },
        {
          title: "Smile Score AI",
          value: loadStats ? "—" : stats.avgSmile,
          note: loadStats ? "Memuat..." : stats.smileNote,
          accent: "from-amber-50 via-white to-white",
          tone: "amber",
        },
        {
          title: "Teller Aktif",
          value: loadStats ? "—" : `${stats.tellerAktif}/${stats.tellerTotal}`,
          note: loadStats ? "Memuat..." : stats.tellerNote,
          accent: "from-purple-50 via-white to-white",
          tone: "purple",
        },
      ]
    : [
        { title: "Total Sesi Hari Ini",      value: "—", note: "Memuat...", accent: "from-sky-50 via-white to-white",     tone: "sky" },
        { title: "Rata-rata Waktu Layanan",   value: "—", note: "Memuat...", accent: "from-emerald-50 via-white to-white", tone: "emerald" },
        { title: "Smile Score AI",            value: "—", note: "Memuat...", accent: "from-amber-50 via-white to-white",   tone: "amber" },
        { title: "Teller Aktif",              value: "—", note: "Memuat...", accent: "from-purple-50 via-white to-white",  tone: "purple" },
      ];

  // ── Chart titles per period ────────────────────────────────────────────────
  const chartTitles = {
    day:   "Tren Performa Layanan (Hari Ini)",
    week:  "Tren Performa Layanan (7 Hari Terakhir)",
    month: "Tren Performa Layanan (Bulan Ini)",
    year:  "Tren Performa Layanan (Tahun Ini)",
  };

  return (
    <div>
      <Navbar title="Dashboard" subtitle="Dashboard" status="Sistem Aktif (Live)" />

      {/* KPI Cards — tampilan sama persis */}
      <section className="section-enter mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} {...stat} icon={statIcons[stat.tone]} />
        ))}
      </section>

      {/* Chart + AI Insights — tampilan sama persis, chart tambah filter */}
      <section className="section-enter mt-8 grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Chart
          title={chartTitles[period]}
          period={period}
          onPeriodChange={setPeriod}
          labels={chartData?.labels || []}
          volume={chartData?.volume || []}
          smileAvg={chartData?.smileAvg || []}
          isEmpty={chartData?.isEmpty}
          loading={loadChart}
          tellers={chartTellers}
          selectedTellerId={selectedTellerId}
          onTellerChange={setSelectedTellerId}
        />
        <AIInsights insights={insights} loading={loadInsights} />
      </section>
    </div>
  );
}

export default Dashboard;
