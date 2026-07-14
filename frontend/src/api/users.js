import apiClient from "./client";

export const createResident = async (data) => {
  const response = await apiClient.post("/api/users/residents", data);
  return response.data;
};

export const createCommittee = async (data) => {
  const response = await apiClient.post("/api/users/committee", data);
  return response.data;
};

export const getResidents = async (params) => {
  const response = await apiClient.get("/api/users/residents", { params });
  return response.data;
};

export const getCommitteeMembers = async (params) => {
  const response = await apiClient.get("/api/users/committee", { params });
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await apiClient.patch(`/api/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/api/users/${id}`);
  return response.data;
};
