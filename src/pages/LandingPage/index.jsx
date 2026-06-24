import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

/* ── Icons ──────────────────────────────────────────────────── */
const LogInIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const features = [
  {
    color: "sky",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="13" width="7" height="8" rx="1.5"/>
        <rect x="13" y="3" width="8" height="12" rx="1.5"/><rect x="13" y="18" width="8" height="3" rx="1.5"/>
      </svg>
    ),
    title: "Dashboard Operasional",
    desc: "KPI harian real-time: total nasabah, rata-rata waktu layanan, Smile Score AI, teller aktif, dan wawasan cerdas dari sistem.",
  },
  {
    color: "emerald",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 1 0 11.4 11.4"/><path d="M17.7 6.3A8 8 0 0 1 20 12"/>
      </svg>
    ),
    title: "Live Monitoring",
    desc: "Pantau teller dan nasabah secara real-time via kamera ganda, deteksi senyum otomatis, dan pencatatan durasi layanan.",
  },
  {
    color: "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 4-6"/>
      </svg>
    ),
    title: "Laporan & Analitik",
    desc: "Laporan lengkap dengan filter periode. Ekspor ke PDF, Excel, CSV, atau Word. Analitik performa teller per periode.",
  },
  {
    color: "indigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6M9 16h6M9 8h3"/><path d="M5 4h8l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/>
      </svg>
    ),
    title: "Activity Logs",
    desc: "Catatan lengkap aktivitas teller, perubahan status akun, dan ringkasan kejadian operasional untuk kebutuhan audit.",
  },
  {
    color: "rose",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 8v6M16 11h6"/>
      </svg>
    ),
    title: "Management Akun",
    desc: "Kelola akun admin & teller: tambah, edit, hapus, atur role dan status aktif/nonaktif dalam satu halaman terpusat.",
  },
  {
    color: "cyan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: "Pemantauan SLA",
    desc: "Monitoring otomatis waktu layanan. Deteksi dini pelanggaran SLA untuk menjaga kualitas layanan tetap optimal.",
  },
];

/* ── Scroll Reveal Hook ──────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp-visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const els = node.querySelectorAll(".lp-reveal");
    els.forEach((el) => observer.observe(el));
    return () => els.forEach((el) => observer.unobserve(el));
  }, []);
  return ref;
}

/* ── Navbar ─────────────────────────────────────────────────── */
function LPNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
      <div className="lp-nav-inner">
        {/* Logo */}
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-icon">
            <span>SF</span>
          </div>
          <div>
            <p className="lp-nav-brand-sub">SFMS.AI</p>
            <p className="lp-nav-brand-main">Smart Teller Monitoring</p>
          </div>
        </div>

        {/* Links */}
        <ul className="lp-nav-links">
          {[["fitur","Fitur"],["analitik","Analitik"],["metrik","Metrik"]].map(([id, label]) => (
            <li key={id}>
              <button onClick={() => scrollTo(id)} className="lp-nav-link">{label}</button>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button className="lp-btn-primary-sm" onClick={() => navigate("/login")} id="lp-login-btn">
          <LogInIcon /> Masuk
        </button>
      </div>
    </nav>
  );
}

/* ── Dashboard Preview Widget ────────────────────────────────── */
function DashboardPreview() {
  const barData = [72, 85, 60, 92, 78, 95, 68, 88, 74, 96];

  return (
    <div className="lp-preview-shell">
      {/* Glow */}
      <div className="lp-preview-glow" />

      <div className="lp-preview-card">
        {/* Chrome bar */}
        <div className="lp-chrome-bar">
          <div className="lp-chrome-dot" style={{background:"#ff5f57"}} />
          <div className="lp-chrome-dot" style={{background:"#febc2e"}} />
          <div className="lp-chrome-dot" style={{background:"#28c840"}} />
          <div className="lp-chrome-url">sfms.app/dashboard</div>
        </div>

        {/* Body */}
        <div className="lp-preview-body">
          {/* KPI row */}
          <div className="lp-kpi-row">
            {[
              { label: "Teller Aktif", value: "4/4", color: "#38bdf8" },
              { label: "Rata-rata Layanan", value: "4m 12s", color: "#34d399" },
              { label: "Smile Score AI", value: "88%", color: "#fbbf24" },
            ].map((k) => (
              <div key={k.label} className="lp-kpi-card">
                <div className="lp-kpi-label">{k.label}</div>
                <div className="lp-kpi-value" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <div className="lp-mini-chart">
            <div className="lp-mini-chart-title">Tren Layanan — Hari Ini</div>
            <div className="lp-mini-bars">
              {barData.map((h, i) => (
                <div key={i} className="lp-mini-bar-wrap">
                  <div
                    className="lp-mini-bar"
                    style={{
                      height: `${h}%`,
                      background: i === barData.length - 1
                        ? "#38bdf8"
                        : `rgba(56,189,248,${0.3 + h / 200})`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status row */}
          <div className="lp-status-row">
            <div className="lp-status-item">
              <span className="lp-status-dot lp-status-dot--green" />
              <span>SLA: 97.8%</span>
            </div>
            <div className="lp-status-item">
              <span className="lp-status-dot lp-status-dot--sky" />
              <span>AI Aktif</span>
            </div>
            <div className="lp-status-item">
              <span className="lp-status-dot lp-status-dot--amber" />
              <span>3 Sesi Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero Section ────────────────────────────────────────────── */
function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="lp-hero" id="hero">
      <div className="lp-container">
        <div className="lp-hero-grid">

          {/* Left: text */}
          <div className="lp-hero-left">
            <div className="lp-hero-badge">
              <span className="lp-badge-pulse" />
              Platform Operasional Perbankan
            </div>

            <h1 className="lp-hero-title">
              Smart Financial{" "}
              <span className="lp-gradient-text">Monitoring System</span>
            </h1>

            <p className="lp-hero-desc">
              Kelola operasional perbankan Anda dengan pemantauan teller real-time,
              analitik performa cerdas, deteksi senyum AI, dan pelacakan SLA otomatis —
              semua dalam satu pusat kendali.
            </p>

            <div className="lp-hero-actions">
              <button className="lp-hero-btn-primary" onClick={() => navigate("/login")} id="hero-login-btn">
                <LogInIcon /> Masuk Dashboard
              </button>
              <button
                className="lp-hero-btn-ghost"
                onClick={() => document.getElementById("fitur")?.scrollIntoView({ behavior: "smooth" })}
              >
                Jelajahi Fitur <ArrowIcon />
              </button>
            </div>

            {/* Stats */}
            <div className="lp-hero-stats">
              {[
                { val: "99.9%", label: "Uptime SLA" },
                { val: "4+", label: "Teller Aktif" },
                { val: "24/7", label: "Monitoring" },
              ].map((s) => (
                <div key={s.label} className="lp-hero-stat">
                  <div className="lp-hero-stat-val">{s.val}</div>
                  <div className="lp-hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: preview */}
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

/* ── Features Section ────────────────────────────────────────── */
function FeaturesSection() {
  const ref = useScrollReveal();
  return (
    <section className="lp-features" id="fitur" ref={ref}>
      <div className="lp-container">
        <div className="lp-section-header lp-reveal">
          <div className="lp-section-badge">Fitur Unggulan</div>
          <h2 className="lp-section-title">Semua yang Anda Butuhkan<br/>untuk Mengelola Operasional Bank</h2>
          <p className="lp-section-sub">
            Rangkaian alat lengkap yang dirancang khusus untuk keunggulan operasional di lingkungan perbankan modern.
          </p>
        </div>

        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div key={f.title} className={`lp-feature-card lp-reveal lp-reveal-delay-${(i % 3) + 1}`}>
              <div className={`lp-feature-icon lp-icon-${f.color}`}>
                {f.icon}
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Analytics Section ───────────────────────────────────────── */
function AnalyticsSection() {
  const ref = useScrollReveal();
  const bars = [
    { d: "Sen", v: 85, s: 60 },
    { d: "Sel", v: 92, s: 72 },
    { d: "Rab", v: 78, s: 55 },
    { d: "Kam", v: 95, s: 80 },
    { d: "Jum", v: 88, s: 65 },
    { d: "Sab", v: 70, s: 45 },
    { d: "Min", v: 55, s: 35 },
  ];

  return (
    <section className="lp-analytics" id="analitik" ref={ref}>
      <div className="lp-container">
        <div className="lp-analytics-grid">

          {/* Left: content */}
          <div className="lp-analytics-left lp-reveal">
            <div className="lp-section-badge">Wawasan Berbasis Data</div>
            <h2 className="lp-section-title" style={{ marginTop: 16 }}>
              Analitik Mendalam untuk Keputusan Lebih Cerdas
            </h2>
            <p className="lp-section-sub" style={{ marginTop: 14 }}>
              Ubah data operasional menjadi insight yang bisa ditindaklanjuti dengan mesin analitik canggih kami.
            </p>

            <div className="lp-check-list">
              {[
                { title: "Skor Performa Teller", desc: "Penilaian otomatis berdasarkan kecepatan transaksi, tingkat senyum, dan waktu tunggu nasabah." },
                { title: "Deteksi Senyum AI", desc: "Sistem AI mendeteksi dan menilai senyum teller otomatis untuk memastikan standar layanan prima." },
                { title: "Ekspor Laporan Fleksibel", desc: "Buat laporan dengan rentang tanggal fleksibel dan ekspor ke PDF, CSV, Excel, atau Word." },
              ].map((item, i) => (
                <div key={item.title} className={`lp-check-item lp-reveal lp-reveal-delay-${i + 1}`}>
                  <div className="lp-check-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="lp-check-title">{item.title}</h4>
                    <p className="lp-check-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chart preview */}
          <div className="lp-analytics-chart lp-reveal lp-reveal-delay-2">
            <div className="lp-chart-header">
              <span className="lp-chart-title">Ringkasan Performa Mingguan</span>
              <span className="lp-chart-live"><span className="lp-badge-pulse lp-pulse-sm" />Live</span>
            </div>

            <div className="lp-bar-chart-area">
              {bars.map((b) => (
                <div key={b.d} className="lp-bar-col">
                  <div className="lp-bar-pair">
                    <div className="lp-bar lp-bar--sky" style={{ height: `${b.v}%` }} />
                    <div className="lp-bar lp-bar--indigo" style={{ height: `${b.s}%` }} />
                  </div>
                  <span className="lp-bar-label">{b.d}</span>
                </div>
              ))}
            </div>

            <div className="lp-chart-legend">
              <span className="lp-legend-item"><span className="lp-legend-dot lp-legend-dot--sky" />Volume</span>
              <span className="lp-legend-item"><span className="lp-legend-dot lp-legend-dot--indigo" />Smile Score</span>
            </div>

            <div className="lp-chart-summary">
              {[
                { val: "94.2%", label: "Efisiensi", color: "#38bdf8" },
                { val: "1.247", label: "Transaksi", color: "#34d399" },
                { val: "88%",   label: "Skor Senyum", color: "#fbbf24" },
              ].map((s) => (
                <div key={s.label} className="lp-chart-stat">
                  <div className="lp-chart-stat-val" style={{ color: s.color }}>{s.val}</div>
                  <div className="lp-chart-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Metrics Section ─────────────────────────────────────────── */
function MetricsSection() {
  const ref = useScrollReveal();
  const metrics = [
    { val: "99.9%", label: "Uptime Sistem", icon: "🛡️" },
    { val: "< 2d",  label: "Waktu Respons", icon: "⚡" },
    { val: "24/7",  label: "Cakupan Monitoring", icon: "👁️" },
    { val: "100%",  label: "Akurasi AI", icon: "🤖" },
  ];

  return (
    <section className="lp-metrics" id="metrik" ref={ref}>
      <div className="lp-container">
        <div className="lp-metrics-inner">
          <div className="lp-metrics-left lp-reveal">
            <div className="lp-section-badge">Performa Sistem</div>
            <h2 className="lp-section-title" style={{ marginTop: 14 }}>
              Dipercaya untuk Operasional Perbankan Sehari-hari
            </h2>
            <p className="lp-section-sub" style={{ marginTop: 14 }}>
              SFMS dirancang dengan standar keandalan tinggi untuk mendukung operasional teller perbankan yang tidak boleh berhenti.
            </p>
            <button
              className="lp-hero-btn-primary"
              style={{ marginTop: 28 }}
              onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
            >
              <LogInIcon /> Mulai Sekarang
            </button>
          </div>

          <div className="lp-metrics-grid">
            {metrics.map((m, i) => (
              <div key={m.label} className={`lp-metric-card lp-reveal lp-reveal-delay-${i + 1}`}>
                <div className="lp-metric-icon">{m.icon}</div>
                <div className="lp-metric-val">{m.val}</div>
                <div className="lp-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA Section ─────────────────────────────────────────────── */
function CTASection() {
  const ref = useScrollReveal();
  const navigate = useNavigate();

  return (
    <section className="lp-cta" ref={ref}>
      <div className="lp-container">
        <div className="lp-cta-card lp-reveal">
          <div className="lp-cta-glow" />
          <div className="lp-section-badge" style={{ margin: "0 auto 20px" }}>Mulai Sekarang</div>
          <h2 className="lp-cta-title">Siap Mengoptimalkan<br/>Operasional Perbankan Anda?</h2>
          <p className="lp-cta-desc">
            Akses dashboard SFMS dan mulai pantau performa teller, lacak kepatuhan SLA,
            serta buat keputusan berbasis data secara real-time.
          </p>
          <div className="lp-cta-actions">
            <button className="lp-hero-btn-primary lp-hero-btn-lg" onClick={() => navigate("/login")} id="cta-login-btn">
              <LogInIcon /> Masuk ke Dashboard
            </button>
            <button
              className="lp-hero-btn-ghost lp-hero-btn-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Kembali ke Atas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Export ─────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="lp-root">
      <div className="lp-bg-orbs" />
      <LPNavbar />
      <HeroSection />
      <FeaturesSection />
      <AnalyticsSection />
      <MetricsSection />
      <CTASection />
    </div>
  );
}
