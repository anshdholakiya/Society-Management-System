import { create } from "zustand";
import api from "../services/api";

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start true so we can verify if a session cookie exists on boot

    // Hydrate session and check if cookie token is valid
    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get("/api/auth/me");
            if (response.data?.success && response.data.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    // Login action
    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/api/auth/login", { email, password });
            if (response.data?.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return { success: true, user: response.data.user };
            }
            set({ isLoading: false });
            return { success: false, message: "Invalid login credentials" };
        } catch (error) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Login failed. Please verify connection.";
            return { success: false, message };
        }
    },

    // Registration action (forces role to resident on public route)
    register: async (userData) => {
        set({ isLoading: true });
        try {
            const response = await api.post("/api/auth/register", userData);
            if (response.data?.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return { success: true, user: response.data.user };
            }
            set({ isLoading: false });
            return { success: false, message: "Registration failed." };
        } catch (error) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Registration failed. Try again.";
            return { success: false, message };
        }
    },

    // Logout action
    logout: async () => {
        set({ isLoading: true });
        try {
            await api.post("/api/auth/logout");
            set({ user: null, isAuthenticated: false, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            return { success: false, message: "Logout failed." };
        }
    },
}));

export default useAuthStore;
