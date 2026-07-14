import apiClient from "./client";

export const createBill = async (data) => {
  const response = await apiClient.post("/api/bills", data);
  return response.data;
};

export const bulkGenerateBills = async (data) => {
  const response = await apiClient.post("/api/bills/bulk", data);
  return response.data;
};

export const getBills = async (params) => {
  const response = await apiClient.get("/api/bills", { params });
  return response.data;
};

export const deleteBill = async (id) => {
  const response = await apiClient.delete(`/api/bills/${id}`);
  return response.data;
};

export const recordPayment = async (data) => {
  const response = await apiClient.post("/api/payments", data);
  return response.data;
};

export const getPayments = async (params) => {
  const response = await apiClient.get("/api/payments", { params });
  return response.data;
};
