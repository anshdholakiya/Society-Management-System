import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserSquare2,
  FileWarning,
  Wrench,
  Receipt,
  CreditCard,
  Megaphone,
  History,
  UserCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Define sidebar items based on role
  const getNavItems = (role) => {
    const adminItems = [
      { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/residents", label: "Residents", icon: Users },
      { path: "/admin/committee", label: "Committee Members", icon: UserSquare2 },
      { path: "/admin/complaints", label: "Complaints", icon: FileWarning },
      { path: "/admin/service-requests", label: "Service Requests", icon: Wrench },
      { path: "/admin/bills", label: "Bills", icon: Receipt },
      { path: "/admin/payments", label: "Payments", icon: CreditCard },
      { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { path: "/admin/audit-logs", label: "Audit Logs", icon: History },
    ];

    const committeeItems = [
      { path: "/committee/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/committee/complaints", label: "Complaints", icon: FileWarning },
      { path: "/committee/service-requests", label: "Service Requests", icon: Wrench },
      { path: "/committee/announcements", label: "Announcements", icon: Megaphone },
    ];

    const residentItems = [
      { path: "/resident/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/resident/complaints", label: "My Complaints", icon: FileWarning },
      { path: "/resident/service-requests", label: "My Service Requests", icon: Wrench },
      { path: "/resident/bills", label: "My Bills", icon: Receipt },
      { path: "/resident/payments", label: "My Payments", icon: CreditCard },
      { path: "/resident/announcements", label: "Announcements", icon: Megaphone },
      { path: "/resident/profile", label: "My Profile", icon: UserCircle },
    ];

    if (role === "admin") return adminItems;
    if (role === "committee_member") return committeeItems;
    return residentItems;
  };

  const navItems = getNavItems(user?.role);

  return (
    <div className="h-screen w-screen bg-background flex overflow-hidden">

      {/* 1. Left Sidebar - Desktop (static) & Mobile (fixed Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-surface border-r border-primary/25 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:h-full shrink-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface/10 bg-primary/95">
          <span className="font-display text-2xl font-bold tracking-tight text-accent">
            Society
          </span>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-surface/80 hover:text-surface cursor-pointer"
            onClick={toggleMobileMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Index */}
        <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 transition-all text-sm font-sans font-medium border-l-4 ${isActive
                    ? "border-accent text-accent font-semibold pl-3 bg-surface/5"
                    : "border-transparent text-surface/80 hover:text-surface hover:border-accent/40 pl-3"
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-surface border-b border-primary/10 flex items-center justify-between px-6 select-none">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
              onClick={toggleMobileMenu}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-text/50">Current Panel</span>
              <p className="text-xs font-mono font-bold uppercase text-primary -mt-0.5">
                {user?.role?.replace("_", " ")} Mode
              </p>
            </div>
          </div>

          {/* User Session Profile & Signout */}
          <div className="flex items-center gap-6">
            <div className="text-right flex flex-col items-end">
              <span className="font-display font-bold text-sm text-primary">
                {user?.fullName}
              </span>
              <span className="font-mono text-[10px] text-text/60 uppercase">
                {user?.role === "resident"
                  ? `Unit: ${user.block}-${user.unitNumber}`
                  : user?.designation || "Committee rep"}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 px-2">
              <LogOut className="w-4 h-4 stroke-[2]" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Inner Context View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
