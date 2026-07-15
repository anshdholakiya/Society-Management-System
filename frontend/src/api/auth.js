import apiClient from "./client";



export const loginUser = async (data) => {
  const response = await apiClient.post("/api/auth/login", data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/api/auth/me");
  return response.data;
};
