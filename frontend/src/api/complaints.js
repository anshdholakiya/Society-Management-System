import apiClient from "./client";

export const createComplaint = async (formData) => {
  const response = await apiClient.post("/api/complaints", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return response.data;
};

export const getComplaints = async (params) => {
  const response = await apiClient.get("/api/complaints", { params });
  return response.data;
};

export const assignComplaint = async (complaintId, data) => {
  const response = await apiClient.post(`/api/complaints/${complaintId}/assign`, data);
  return response.data;
};

export const updateComplaintStatus = async (complaintId, data) => {
  const response = await apiClient.patch(`/api/complaints/${complaintId}`, data);
  return response.data;
};

export const deleteComplaint = async (complaintId) => {
  const response = await apiClient.delete(`/api/complaints/${complaintId}`);
  return response.data;
};
