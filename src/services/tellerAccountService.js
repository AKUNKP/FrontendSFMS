import api from "./apiClient";

export const fetchTellerAccounts = async () => {
  const response = await api.get("/api/teller-accounts");
  return response.data;
};

export const createTellerAccount = async (payload) => {
  const response = await api.post("/api/teller-accounts", payload);
  return response.data;
};

export const updateTellerAccount = async (id, payload) => {
  const response = await api.put(`/api/teller-accounts/${id}`, payload);
  return response.data;
};

export const deleteTellerAccount = async (id) => {
  const response = await api.delete(`/api/teller-accounts/${id}`);
  return response.data;
};
