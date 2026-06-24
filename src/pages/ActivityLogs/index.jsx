import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

const API = process.env.REACT_APP_API_BASE_URL;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "Terdeteksi",       label: "Terdeteksi" },
  { value: "Kurang",           label: "Kurang" },
  { value: "Tidak Senyum",     label: "Tidak Senyum" },
  { value: "Tidak Terdeteksi", label: "Tidak Terdeteksi" },
];

function StatusBadge({ status }) {
  const map = {
    "Terdeteksi":       "bg-emerald-100 text-emerald-700",
    "Kurang":           "bg-amber-100  text-amber-700",
    "Tidak Senyum":     "bg-orange-100 text-orange-700",
    "Tidak Terdeteksi": "bg-slate-100  text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status || "—"}
    </span>
  );
}

function SmileBar({ score }) {
  if (score === null || score === undefined) return <span className="text-slate-300 text-xs">—</span>;
  const color = score >= 60 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${score >= 60 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-rose-500"}`}>
        {score}%
      </span>
    </div>
  );
}

function ActivityLogs() {
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  // Filter & pagination state
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const buildUrl = useCallback((p = page) => {
    const params = new URLSearchParams();
    params.set("page", p);
    params.set("limit", "20");
    if (search)   params.set("search",   search);
    if (status)   params.set("status",   status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);
    return `${API}/api/activity-logs?${params.toString()}`;
  }, [page, search, status, dateFrom, dateTo]);

  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildUrl(p));
      const data = await res.json();
      setLogs(data.data || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (e) {
      setError("Gagal memuat data. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  }, [buildUrl, page]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [search, status, dateFrom, dateTo]); // eslint-disable-line

  useEffect(() => {
    fetchLogs(page);
  }, [page]); // eslint-disable-line

  return (
    <div>
      <Navbar title="Activity Logs" subtitle="Riwayat" />

      {/* Filter + Table */}
      <section className="section-enter mt-8 rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Riwayat</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Activity Logs Teller</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Cari nama teller / kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none w-48"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          />
          <span className="self-center text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          />
          {(search || status || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setStatus(""); setDateFrom(""); setDateTo(""); }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Teller</th>
                <th className="pb-3 pr-4">Waktu Selesai</th>
                <th className="pb-3 pr-4">Durasi</th>
                <th className="pb-3 pr-4">Smile Score</th>
                <th className="pb-3">Status Deteksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5].map((i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map((j) => (
                      <td key={j} className="py-3 pr-4">
                        <div className="h-4 rounded bg-slate-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : logs.map((log, i) => (
                <tr key={log.id_log} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pr-4 text-xs text-slate-400">
                    {(page - 1) * 20 + i + 1}
                  </td>
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-slate-800">{log.nama_teller}</p>
                      <p className="text-[10px] text-slate-400">{log.kode_teller}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {log.waktu_selesai
                      ? new Date(log.waktu_selesai).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{log.durasi_fmt}</td>
                  <td className="py-3 pr-4"><SmileBar score={log.smile_score} /></td>
                  <td className="py-3"><StatusBadge status={log.status_deteksi} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="text-slate-400">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} dari {pagination.total} data
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-slate-300 transition"
              >
                ← Prev
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-slate-300 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ActivityLogs;
