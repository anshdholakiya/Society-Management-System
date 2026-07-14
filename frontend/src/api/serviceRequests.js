import apiClient from "./client";

export const createServiceRequest = async (formData) => {
  const response = await apiClient.post("/api/service-requests", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return response.data;
};

export const getServiceRequests = async (params) => {
  const response = await apiClient.get("/api/service-requests", { params });
  return response.data;
};

export const updateServiceRequestStatus = async (id, data) => {
  const response = await apiClient.patch(`/api/service-requests/${id}`, data);
  return response.data;
};

export const deleteServiceRequest = async (id) => {
  const response = await apiClient.delete(`/api/service-requests/${id}`);
  return response.data;
};
