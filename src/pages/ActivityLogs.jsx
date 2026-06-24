import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Table from "../components/Table";
import { fetchActivityLogs } from "../services/activityLogService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  if (typeof value !== "number") return String(value);
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatSmileScore = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}%`;
  return String(value);
};

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("waktu_selesai");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const payload = await fetchActivityLogs();
        const data = Array.isArray(payload) ? payload : payload?.data || [];
        if (isMounted) {
          setLogs(data);
        }
      } catch (err) {
        if (isMounted) {
          setError("Gagal memuat activity logs. Coba lagi nanti.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedLogs = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        waktu_selesai_formatted: formatDateTime(log.waktu_selesai),
        durasi_layanan_formatted: formatDuration(log.durasi_layanan),
        smile_score_formatted: formatSmileScore(log.smile_score_avg),
      })),
    [logs]
  );

  const sortedLogs = useMemo(() => {
    const data = [...normalizedLogs];
    const direction = sortDirection === "asc" ? 1 : -1;

    const getValue = (row) => {
      if (sortKey === "waktu_selesai") {
        const time = new Date(row.waktu_selesai).getTime();
        return Number.isNaN(time) ? 0 : time;
      }
      if (sortKey === "durasi_layanan") {
        return Number(row.durasi_layanan) || 0;
      }
      if (sortKey === "smile_score_avg") {
        return Number(row.smile_score_avg) || 0;
      }
      return String(row[sortKey] ?? "").toLowerCase();
    };

    return data.sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [normalizedLogs, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [pageSize, safePage, sortedLogs]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const columns = useMemo(
    () => [
      {
        key: "nama_teller",
        label: "Nama Teller",
        sortable: true,
        render: (row) => <span className="font-semibold text-slate-800">{row.nama_teller || "-"}</span>,
      },
      {
        key: "waktu_selesai",
        label: "Waktu Selesai",
        sortable: true,
        render: (row) => row.waktu_selesai_formatted || row.waktu_selesai || "-",
      },
      {
        key: "durasi_layanan",
        label: "Durasi Layanan",
        sortable: true,
        render: (row) => row.durasi_layanan_formatted || row.durasi_layanan || "-",
      },
      {
        key: "smile_score_avg",
        label: "Smile Score",
        sortable: true,
        render: (row) => row.smile_score_formatted || row.smile_score_avg || "-",
      },
      {
        key: "status_deteksi",
        label: "Status Deteksi",
        sortable: true,
        render: (row) => <StatusBadge value={row.status_deteksi} />,
      },
    ],
    []
  );

  const handleSort = (key) => {
    setSortDirection((prev) => (key === sortKey ? (prev === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
    setCurrentPage(1);
  };

  const startItem = sortedLogs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(sortedLogs.length, safePage * pageSize);

  return (
    <div>
      <Navbar title="Activity Logs" subtitle="Riwayat" />

      <section className="mt-8 rounded-3xl bg-white/90 p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Activity Logs</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Ringkasan Aktivitas Teller</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {normalizedLogs.length} Log
          </span>
        </div>

        <div className="mt-6">
          {isLoading ? <p className="text-sm text-slate-500">Memuat data...</p> : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          {!isLoading && !error && normalizedLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada activity log.</p>
          ) : null}
          {!isLoading && !error && normalizedLogs.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[720px]">
                <Table
                  columns={columns}
                  rows={paginatedLogs}
                  rowKey="id_log"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Tampilkan</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                  >
                    {[5, 8, 10, 20].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>baris</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {startItem}-{endItem} dari {sortedLogs.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = (value || "").toLowerCase();
  const isDetected = status === "terdeteksi";

  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold ${
        isDetected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {value || "-"}
    </span>
  );
}

export default ActivityLogs;
