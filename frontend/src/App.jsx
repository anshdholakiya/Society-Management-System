import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global Toast Provider */}
        <Toaster position="top-right" reverseOrder={false} />

        <div className="min-h-screen bg-background text-text">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}
