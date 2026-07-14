import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button, Avatar } from "@heroui/react";
import { 
    Menu, X, LayoutDashboard, Users, Megaphone, 
    FileText, Wrench, CreditCard, ShieldAlert, LogOut, Building 
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            toast.success("Successfully logged out.");
            navigate("/login");
        } else {
            toast.error("Logout failed.");
        }
    };

    // Define navigation links with role checking
    const allLinks = [
        {
            name: "Dashboard",
            path: user?.role === "admin" ? "/admin" : user?.role === "committee_member" ? "/committee" : "/resident",
            icon: LayoutDashboard,
            roles: ["admin", "committee_member", "resident"]
        },
        {
            name: "User Directory",
            path: "/users",
            icon: Users,
            roles: ["admin", "committee_member"]
        },
        {
            name: "Announcements",
            path: "/announcements",
            icon: Megaphone,
            roles: ["admin", "committee_member", "resident"]
        },
        {
            name: "Complaints",
            path: "/complaints",
            icon: ShieldAlert,
            roles: ["admin", "committee_member", "resident"]
        },
        {
            name: "Service Requests",
            path: "/service-requests",
            icon: Wrench,
            roles: ["admin", "committee_member", "resident"]
        },
        {
            name: "Billing Invoices",
            path: "/billing",
            icon: CreditCard,
            roles: ["admin", "resident"]
        },
        {
            name: "Payments Desk",
            path: "/payments",
            icon: FileText,
            roles: ["admin"]
        }
    ];

    const activeLinks = allLinks.filter(link => link.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Desktop View) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/60 sticky top-0 h-screen z-20">
                {/* Logo Section */}
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-100">
                        <Building size={20} />
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 text-sm tracking-tight block">Society Manager</span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Admin Panel</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
                    {activeLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50" 
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                }`}
                            >
                                <Icon size={18} />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Card Profile Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-2">
                        <Avatar
                            name={user?.fullName || "User"}
                            color="primary"
                            size="sm"
                            className="font-semibold shadow-sm"
                        />
                        <div className="overflow-hidden">
                            <span className="font-semibold text-slate-700 text-sm block truncate">{user?.fullName}</span>
                            <span className="text-xs text-slate-400 font-medium capitalize block">{user?.role?.replace("_", " ")}</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="flat"
                        color="danger"
                        size="sm"
                        startContent={<LogOut size={14} />}
                        className="w-full font-semibold rounded-lg"
                    >
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Mobile Navigation Drawer Overlay */}
            {isMobileMenuOpen && (
                <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
                />
            )}

            {/* Sidebar (Mobile View sliding drawer) */}
            <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-40 md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-100">
                            <Building size={18} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm tracking-tight block">Society Manager</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                    {activeLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive 
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                }`}
                            >
                                <Icon size={18} />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-2">
                        <Avatar
                            name={user?.fullName || "User"}
                            color="primary"
                            size="sm"
                            className="font-semibold shadow-sm"
                        />
                        <div className="overflow-hidden">
                            <span className="font-semibold text-slate-700 text-sm block truncate">{user?.fullName}</span>
                            <span className="text-xs text-slate-400 font-medium capitalize block">{user?.role?.replace("_", " ")}</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="flat"
                        color="danger"
                        size="sm"
                        startContent={<LogOut size={14} />}
                        className="w-full font-semibold rounded-lg"
                    >
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar Header */}
                <header className="sticky top-0 bg-white border-b border-slate-200/60 h-16 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-lg hover:bg-slate-50 text-slate-600 md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-md font-semibold text-slate-800 capitalize md:block hidden">
                            {location.pathname.replace("/", "").replace("-", " ") || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right md:block hidden">
                            <span className="font-semibold text-slate-700 text-xs block">{user?.fullName}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{user?.role?.replace("_", " ")}</span>
                        </div>
                        <Avatar
                            name={user?.fullName || "User"}
                            color="primary"
                            size="sm"
                            className="font-semibold shadow-sm cursor-pointer"
                        />
                    </div>
                </header>

                {/* Main Dynamic Viewport */}
                <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
