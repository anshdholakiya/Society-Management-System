import React, { createContext, useState, useEffect, useContext } from "react";
import { getMe, loginUser, logoutUser } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await getMe();
        if (data && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        // Silent error: no session cookie is valid or active
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser({ email, password });
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error("Invalid response format from server");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
    }
  };

  const refetchUser = async () => {
    try {
      const data = await getMe();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
