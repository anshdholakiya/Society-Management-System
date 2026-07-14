import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://society-management-system-54lq.onrender.com",
    withCredentials: true, // Crucial: enables automatic handling of HttpOnly cookies (session token)
});

export default api;
