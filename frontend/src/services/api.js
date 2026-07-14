import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true, // Crucial: enables automatic handling of HttpOnly cookies (session token)
});

export default api;
