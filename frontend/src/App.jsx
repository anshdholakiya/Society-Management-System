import { useEffect } from "react";
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

    const getDashboardPath = () => {
        if (user?.role === "admin") return "/admin";
        if (user?.role === "committee_member") return "/committee";
        return "/resident";
    };

    return (
        <Router>
            {isLoading ? (
                <div className="flex min-h-screen items-center justify-center bg-slate-50">
                    <Spinner size="lg" color="primary" label="Loading portal..." />
                </div>
            ) : (
                <Routes>
                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                <Navigate to={getDashboardPath()} replace />
                            ) : (
                                <Login />
                            )
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            isAuthenticated ? (
                                <Navigate to={getDashboardPath()} replace />
                            ) : (
                                <Register />
                            )
                        }
                    />

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

                    <Route
                        path="*"
                        element={
                            isAuthenticated ? (
                                <Navigate to={getDashboardPath()} replace />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                </Routes>
            )}
        </Router>
    );
}
