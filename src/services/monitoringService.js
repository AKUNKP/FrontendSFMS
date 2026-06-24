import api from "./apiClient";

/**
 * Start a new monitoring session (creates service_session row).
 *
 * @param {number} idTeller — teller ID
 * @returns {{ id_transaksi: number }}
 */
export const startSession = async (idTeller) => {
  const response = await api.post("/api/monitoring/session/start", {
    id_teller: idTeller,
  });
  return response.data;
};

/**
 * Stop a monitoring session (updates service_session + creates activity_log).
 *
 * @param {number} idTransaksi — session ID
 * @returns {{ durasi_layanan: number }}
 */
export const stopSession = async (idTransaksi) => {
  const response = await api.post("/api/monitoring/session/stop", {
    id_transaksi: idTransaksi,
  });
  return response.data;
};

/**
 * Save smile detection data (batch insert into smile_detections).
 *
 * @param {number} idTransaksi — session ID
 * @param {number} smileScore — smile score 0-100 as float (e.g., 0.72)
 * @param {string} kategori — "Senyum" | "Netral" | "Kurang Senyum"
 */
export const saveSmileDetection = async (idTransaksi, smileScore, kategori) => {
  const response = await api.post("/api/monitoring/smile", {
    id_transaksi: idTransaksi,
    smile_score: smileScore,
    kategori,
  });
  return response.data;
};

/**
 * Get current session info.
 *
 * @param {number} idTransaksi — session ID
 */
export const getSession = async (idTransaksi) => {
  const response = await api.get(`/api/monitoring/session/${idTransaksi}`);
  return response.data;
};
