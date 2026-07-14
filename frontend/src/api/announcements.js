import apiClient from "./client";

export const createAnnouncement = async (formData) => {
  const response = await apiClient.post("/api/announcements", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAnnouncements = async (params) => {
  const response = await apiClient.get("/api/announcements", { params });
  return response.data;
};

export const getAnnouncementDetails = async (id) => {
  const response = await apiClient.get(`/api/announcements/${id}`);
  return response.data;
};

export const updateAnnouncement = async (id, data) => {
  const response = await apiClient.patch(`/api/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await apiClient.delete(`/api/announcements/${id}`);
  return response.data;
};
