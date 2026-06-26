import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Table from "../../components/Table";
import {
  createTellerAccount,
  deleteTellerAccount,
  fetchTellerAccounts,
  updateTellerAccount,
} from "../../services/tellerAccountService";

// ── Password strength rules ────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "len",    regex: /.{8,}/,          label: "Minimal 8 karakter" },
  { id: "upper",  regex: /[A-Z]/,          label: "Huruf besar (A-Z)" },
  { id: "lower",  regex: /[a-z]/,          label: "Huruf kecil (a-z)" },
  { id: "digit",  regex: /[0-9]/,          label: "Angka (0-9)" },
  { id: "symbol", regex: /[^A-Za-z0-9]/,  label: "Simbol (!@#$%^&*)" },
];

const checkPassword = (pwd) => PASSWORD_RULES.map((r) => ({ ...r, ok: r.regex.test(pwd) }));
const isPasswordStrong = (pwd) => checkPassword(pwd).every((r) => r.ok);

// ── PasswordStrengthMeter component ───────────────────────────────────────────
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const results = checkPassword(password);
  const passCount = results.filter((r) => r.ok).length;
  const strength = passCount <= 2 ? "weak" : passCount <= 4 ? "medium" : "strong";
  const barColor = strength === "strong" ? "bg-emerald-400" : strength === "medium" ? "bg-amber-400" : "bg-rose-400";
  const barLabel = strength === "strong" ? "Kuat" : strength === "medium" ? "Sedang" : "Lemah";

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(passCount / 5) * 100}%` }}
          />
        </div>
        <span className={`text-[10px] font-semibold ${
          strength === "strong" ? "text-emerald-600" :
          strength === "medium" ? "text-amber-500" : "text-rose-500"
        }`}>{barLabel}</span>
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {results.map((r) => (
          <div key={r.id} className="flex items-center gap-1.5">
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              r.ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}>
              {r.ok ? "✓" : "✗"}
            </span>
            <span className={`text-[11px] ${ r.ok ? "text-emerald-700" : "text-slate-400"}`}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyForm = {
  nama: "",
  username: "",
  email: "",
  password: "",
  role: "teller",
  status: "active",
};

function TellerManagement() {
  const [tellers, setTellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tellerToDelete, setTellerToDelete] = useState(null);

  const loadTellers = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = await fetchTellerAccounts();
      setTellers(payload.data || []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal memuat data akun.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTellers();
  }, []);

  const openAdd = () => {
    setFormMode("add");
    setFormData(emptyForm);
    setEditingId(null);
    setSubmitError("");
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setFormMode("edit");
    setFormData({
      nama: row.nama || "",
      username: row.username,
      email: row.email || "",
      password: "",
      role: row.role || "teller",
      status: row.status || "active",
    });
    setEditingId(row.id);
    setSubmitError("");
    setModalOpen(true);
  };

  const toggleStatus = async (row) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";

    setBusyId(row.id);
    setErrorMessage("");

    try {
      const payload = await updateTellerAccount(row.id, { status: nextStatus });
      setTellers((prev) => prev.map((teller) => (teller.id === row.id ? payload.data : teller)));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal mengubah status akun.");
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (row) => {
    setTellerToDelete(row);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setTellerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!tellerToDelete) return;

    setBusyId(tellerToDelete.id);
    setErrorMessage("");
    setDeleteModalOpen(false); // Tutup modal saat loading berjalan

    try {
      await deleteTellerAccount(tellerToDelete.id);
      setTellers((prev) => prev.filter((teller) => teller.id !== tellerToDelete.id));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal menghapus akun.");
    } finally {
      setBusyId(null);
      setTellerToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    // Validasi password kuat di sisi frontend
    if (formMode === "add" && !isPasswordStrong(formData.password)) {
      setSubmitError("Password belum memenuhi standar keamanan. Periksa syarat-syarat di bawah kolom password.");
      setIsSubmitting(false);
      return;
    }
    if (formMode === "edit" && formData.password.trim() && !isPasswordStrong(formData.password)) {
      setSubmitError("Password baru belum memenuhi standar keamanan. Periksa syarat-syarat di bawah kolom password.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (formMode === "add") {
        const payload = await createTellerAccount({
          nama: formData.nama,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status,
        });

        setTellers((prev) => [payload.data, ...prev]);
      } else {
        const updatePayload = {
          nama: formData.nama,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };

        if (formData.password.trim()) {
          updatePayload.password = formData.password;
        }

        const payload = await updateTellerAccount(editingId, updatePayload);
        setTellers((prev) => prev.map((teller) => (teller.id === editingId ? payload.data : teller)));
      }

      setModalOpen(false);
      setFormData(emptyForm);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "nama",
      label: "Nama",
      render: (row) => <span className="font-medium text-slate-800">{row.nama || "-"}</span>,
    },
    {
      key: "username",
      label: "Username",
      render: (row) => <span className="font-medium text-slate-800">{row.username}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (row) => <span className="text-slate-500">{row.email || "-"}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: "status",
      label: "Status Aktif",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Aksi",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            disabled={busyId === row.id || isSubmitting}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => toggleStatus(row)}
            disabled={busyId === row.id || isSubmitting}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              row.status === "active"
                ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            }`}
          >
            {row.status === "active" ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button
            type="button"
            onClick={() => requestDelete(row)}
            disabled={busyId === row.id || isSubmitting}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Navbar title="Management Akun" subtitle="Manajemen" />

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Manajemen</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Daftar Akun Pengguna</h3>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_-18px_rgba(37,99,235,0.7)] transition hover:bg-blue-700"
          >
            Tambah Akun
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500">Memuat data akun...</p>
          ) : (
            <>
              <Table columns={columns} rows={tellers} rowKey="id" />
              {tellers.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Belum ada akun yang terdaftar.</p>
              ) : null}
            </>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Form Akun</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {formMode === "add" ? "Tambah Akun" : "Edit Akun"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {submitError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nama</label>
                <input
                  value={formData.nama}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nama: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Nama pengguna"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Username</label>
                <input
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="username"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="email@domain.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder={formMode === "edit" ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                  required={formMode === "add"}
                />
                <PasswordStrengthMeter password={formData.password} />
                {!formData.password && (
                  <p className="mt-2 text-xs text-slate-400">
                    Wajib: min. 8 karakter, huruf besar/kecil, angka, dan simbol.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</label>
                <select
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, role: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="teller">Teller</option>
                  <option value="spv">Admin (Supervisor)</option>
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Teller hanya bisa mengakses Live Monitoring. Admin bisa mengakses semua fitur.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status Aktif</label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Dialog Konfirmasi Hapus ── */}
      {deleteModalOpen && tellerToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={cancelDelete} />
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] transition-all">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-5 text-center text-lg font-bold text-slate-900">Hapus Akun?</h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{tellerToDelete.username}</span>? Tindakan ini tidak dapat dikembalikan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelDelete}
                className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full rounded-2xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_-18px_rgba(225,29,72,0.7)] transition-colors hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "spv";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isAdmin ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {isAdmin ? "Admin" : "Teller"}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}

export default TellerManagement;
