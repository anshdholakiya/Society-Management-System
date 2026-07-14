import apiClient from "./client";

export const recordPayment = async (data) => {
  const response = await apiClient.post("/api/payments", data);
  return response.data;
};

export const getPayments = async (params) => {
  const response = await apiClient.get("/api/payments", { params });
  return response.data;
};
