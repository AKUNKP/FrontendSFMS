import api from "./apiClient";

export const fetchActivityLogs = async () => {
  const response = await api.get("/api/activity-logs");
  return response.data;
};
