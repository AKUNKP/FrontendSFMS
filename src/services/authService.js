import api from "./apiClient";

/**
 * Login dengan username ATAU email dan password.
 * @param {string} identifier — username atau email
 * @param {string} password
 * @returns {{ id, nama, username, email, role }}
 */
export const loginUser = async (identifier, password) => {
  // Kirim sebagai field "username" (backend membaca field ini untuk username/email)
  const response = await api.post("/api/auth/login", { username: identifier, password });
  return response.data;
};
