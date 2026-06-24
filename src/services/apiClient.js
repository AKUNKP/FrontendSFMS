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

export default apiClient;
