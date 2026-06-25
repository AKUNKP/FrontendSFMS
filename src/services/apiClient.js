import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("sfms_user");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (e) {
      console.error("Gagal membaca token:", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Helper untuk native fetch() yang otomatis menyertakan Bearer token dari localStorage.
 * Gunakan ini sebagai pengganti fetch() biasa di semua halaman.
 */
export function apiFetch(url, options = {}) {
  const raw = localStorage.getItem("sfms_user");
  let token = null;
  try {
    if (raw) token = JSON.parse(raw)?.token || null;
  } catch {
    // ignore
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}

export default apiClient;

