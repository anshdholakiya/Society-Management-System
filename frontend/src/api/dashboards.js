import apiClient from "./client";

export const getAdminDashboard = async () => {
  const response = await apiClient.get("/api/dashboards/admin");
  return response.data;
};

export const getResidentDashboard = async () => {
  const response = await apiClient.get("/api/dashboards/resident");
  return response.data;
};
