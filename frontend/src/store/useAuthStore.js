import { create } from "zustand";
import api from "../services/api";

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isLoggingIn: false,

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
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoggingIn: true });
        try {
            const response = await api.post("/api/auth/login", { email, password });
            if (response.data?.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoggingIn: false,
                });
                return { success: true, user: response.data.user };
            }
            set({ isLoggingIn: false });
            return { success: false, message: "Invalid login credentials" };
        } catch (error) {
            set({ isLoggingIn: false });
            const message = error.response?.data?.message || "Login failed. Please verify connection.";
            return { success: false, message };
        }
    },

    register: async (userData) => {
        set({ isLoggingIn: true });
        try {
            const response = await api.post("/api/auth/register", userData);
            if (response.data?.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoggingIn: false,
                });
                return { success: true, user: response.data.user };
            }
            set({ isLoggingIn: false });
            return { success: false, message: "Registration failed." };
        } catch (error) {
            set({ isLoggingIn: false });
            const message = error.response?.data?.message || "Registration failed. Try again.";
            return { success: false, message };
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await api.post("/api/auth/logout");
        } catch {
            // Clear local state even if server call fails
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        return { success: true };
    },
}));

export default useAuthStore;
