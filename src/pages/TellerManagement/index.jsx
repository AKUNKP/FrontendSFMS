import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Table from "../../components/Table";
import {
  createTellerAccount,
  deleteTellerAccount,
  fetchTellerAccounts,
  updateTellerAccount,
} from "../../services/tellerAccountService";

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

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Hapus akun ${row.username}?`);

    if (!confirmed) {
      return;
    }

    setBusyId(row.id);
    setErrorMessage("");

    try {
      await deleteTellerAccount(row.id);
      setTellers((prev) => prev.filter((teller) => teller.id !== row.id));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Gagal menghapus akun.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

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
            onClick={() => handleDelete(row)}
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
                  placeholder={formMode === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                  required={formMode === "add"}
                />
                <p className="mt-2 text-xs text-slate-400">Password disimpan dalam bentuk hash.</p>
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
