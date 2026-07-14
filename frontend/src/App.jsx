import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Spinner } from "@heroui/react";
import useAuthStore from "./store/useAuthStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import UserDirectory from "./pages/UserDirectory";
import Announcements from "./pages/Announcements";
import ServiceRequests from "./pages/ServiceRequests";
import Complaints from "./pages/Complaints";
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";

// Wrapper to protect authenticated routes and restrict by roles
function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Spinner size="lg" color="primary" label="Verifying session..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If unauthorized, redirect to their corresponding dashboard
        if (user.role === "admin") return <Navigate to="/admin" replace />;
        if (user.role === "committee_member") return <Navigate to="/committee" replace />;
        return <Navigate to="/resident" replace />;
    }

    return children;
}

export default function App() {
    const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Spinner size="lg" color="primary" label="Loading portal..." />
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public Auth Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to={user.role === "admin" ? "/admin" : user.role === "committee_member" ? "/committee" : "/resident"} replace />
                        ) : (
                            <Login />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to={user.role === "admin" ? "/admin" : user.role === "committee_member" ? "/committee" : "/resident"} replace />
                        ) : (
                            <Register />
                        )
                    }
                />

                {/* Dashboard Route Handlers */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/committee"
                    element={
                        <ProtectedRoute allowedRoles={["committee_member"]}>
                            {/* Committee members share dashboard layout metrics view */}
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/resident"
                    element={
                        <ProtectedRoute allowedRoles={["resident"]}>
                            <ResidentDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Society Modules */}
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute allowedRoles={["admin", "committee_member"]}>
                            <UserDirectory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/announcements"
                    element={
                        <ProtectedRoute allowedRoles={["admin", "committee_member", "resident"]}>
                            <Announcements />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/service-requests"
                    element={
                        <ProtectedRoute allowedRoles={["admin", "committee_member", "resident"]}>
                            <ServiceRequests />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/complaints"
                    element={
                        <ProtectedRoute allowedRoles={["admin", "committee_member", "resident"]}>
                            <Complaints />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/billing"
                    element={
                        <ProtectedRoute allowedRoles={["admin", "resident"]}>
                            <Billing />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/payments"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <Payments />
                        </ProtectedRoute>
                    }
                />

                {/* Default Router Catch-All */}
                <Route
                    path="*"
                    element={
                        <Navigate to={isAuthenticated ? (user.role === "admin" ? "/admin" : user.role === "committee_member" ? "/committee" : "/resident") : "/login"} replace />
                    }
                />
            </Routes>
        </Router>
    );
}
