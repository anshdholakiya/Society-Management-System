import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/auth/Login";
import Unauthorized from "./pages/auth/Unauthorized";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import CommitteeDashboard from "./pages/dashboards/CommitteeDashboard";
import ResidentDashboard from "./pages/dashboards/ResidentDashboard";
import Profile from "./pages/auth/Profile";
import ResidentComplaints from "./pages/complaints/ResidentComplaints";
import AdminCommitteeComplaints from "./pages/complaints/AdminCommitteeComplaints";
import ResidentServiceRequests from "./pages/service-requests/ResidentServiceRequests";
import AdminCommitteeServiceRequests from "./pages/service-requests/AdminCommitteeServiceRequests";
import ResidentBilling from "./pages/billing/ResidentBilling";
import AdminBilling from "./pages/billing/AdminBilling";
import AdminPayments from "./pages/billing/AdminPayments";
import ResidentAnnouncements from "./pages/announcements/ResidentAnnouncements";
import AdminCommitteeAnnouncements from "./pages/announcements/AdminCommitteeAnnouncements";
import AdminResidents from "./pages/users/AdminResidents";
import AdminCommitteeMembers from "./pages/users/AdminCommitteeMembers";
import AdminAuditLogs from "./pages/audit-logs/AdminAuditLogs";



// Placeholders
import PlaceholderPage from "./pages/placeholders/PlaceholderPage";
import NotFound from "./pages/placeholders/NotFound";

// Layout & Route Gates
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

export default function AppRoutes() {
  const { user } = useAuth();

  // Route active sessions away from login/register pages
  const getDashboardPath = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "committee_member") return "/committee/dashboard";
    return "/resident/dashboard";
  };

  return (
    <Routes>
      {/* 1. Public Auth Forms (No AppShell wrapping) */}
      <Route
        path="/login"
        element={
          user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Login />
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 2. Gated Application Shell Layout Subtree */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Redirect empty root path to proper dashboard */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* --- Admin Ledger Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/residents" element={<AdminResidents />} />
          <Route path="/admin/committee" element={<AdminCommitteeMembers />} />
          <Route path="/admin/complaints" element={<AdminCommitteeComplaints />} />
          <Route path="/admin/service-requests" element={<AdminCommitteeServiceRequests />} />
          <Route path="/admin/bills" element={<AdminBilling />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/announcements" element={<AdminCommitteeAnnouncements />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* --- Committee Representative Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={["committee_member"]} />}>
          <Route path="/committee/dashboard" element={<CommitteeDashboard />} />
          <Route path="/committee/complaints" element={<AdminCommitteeComplaints />} />
          <Route path="/committee/service-requests" element={<AdminCommitteeServiceRequests />} />
          <Route path="/committee/announcements" element={<PlaceholderPage />} />
        </Route>

        {/* --- Resident Flat Account Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={["resident"]} />}>
          <Route path="/resident/dashboard" element={<ResidentDashboard />} />
          <Route path="/resident/complaints" element={<ResidentComplaints />} />
          <Route path="/resident/service-requests" element={<ResidentServiceRequests />} />
          <Route path="/resident/bills" element={<ResidentBilling />} />
          <Route path="/resident/payments" element={<ResidentBilling />} />
          <Route path="/resident/announcements" element={<ResidentAnnouncements />} />
          <Route path="/resident/profile" element={<Profile />} />
        </Route>

        {/* Catch-all Custom 404 notice view inside AppShell */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
