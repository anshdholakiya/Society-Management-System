import apiClient from "./client";

export const createBill = async (data) => {
  const response = await apiClient.post("/api/bills", data);
  return response.data;
};

export const getBills = async (params) => {
  const response = await apiClient.get("/api/bills", { params });
  return response.data;
};

export const deleteBill = async (billId) => {
  const response = await apiClient.delete(`/api/bills/${billId}`);
  return response.data;
};
