import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for receiving/sending HttpOnly JWT cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Collect error messages from standard backend formats
    const message = error.response?.data?.message || "An unexpected error occurred.";
    
    // We reject with a customized error object that has message
    return Promise.reject({
      ...error,
      message,
      status: error.response?.status,
    });
  }
);

export default apiClient;
