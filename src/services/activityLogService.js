import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

export const fetchActivityLogs = async () => {
  const response = await api.get("/api/activity-logs");
  return response.data;
};
