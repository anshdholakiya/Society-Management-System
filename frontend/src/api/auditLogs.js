import apiClient from "./client";

export const getAuditLogs = async (params) => {
  const response = await apiClient.get("/api/audit-logs", { params });
  return response.data;
};
