import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://society-management-system-54lq.onrender.com",
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
            useAuthStore.getState().logout();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
