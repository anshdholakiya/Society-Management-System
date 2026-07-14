import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, Spinner } from "@heroui/react";
import { Users, Landmark, AlertTriangle, ShieldCheck, Wrench, ShieldAlert, History, Activity } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get("/api/dashboards/admin");
                if (response.data?.success) {
                    setStats(response.data.stats);
                    setAuditLogs(response.data.recentAuditLogs || []);
                } else {
                    toast.error("Failed to load dashboard statistics.");
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "An error occurred fetching dashboard metrics.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" color="primary" label="Aggregating metrics..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Dashboard Title Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Analytics Overview</h1>
                        <p className="text-sm text-slate-500">Real-time statistics of society members and operations</p>
                    </div>
                </div>

                {/* Grid Analytics Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Finance Analytics Card */}
                    <Card className="border border-slate-200/50 shadow-sm p-2">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue Collected</span>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">₹{stats?.finance?.totalCollected?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Landmark size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Outstanding Due:</span>
                                <span className="text-rose-600 font-bold">₹{stats?.finance?.totalOutstanding?.toLocaleString() || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resident Members Stats Card */}
                    <Card className="border border-slate-200/50 shadow-sm p-2">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Residents</span>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.users?.residents || 0}</h3>
                            </div>
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Users size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Committee Members:</span>
                                <span className="text-indigo-600 font-bold">{stats?.users?.committee || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Complaint Distribution Card */}
                    <Card className="border border-slate-200/50 shadow-sm p-2">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Complaints</span>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {(stats?.complaints?.open || 0) + (stats?.complaints?.assigned || 0)}
                                </h3>
                            </div>
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Open: {stats?.complaints?.open || 0}</span>
                                <span className="text-emerald-600 font-bold">Resolved: {stats?.complaints?.resolved || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Request Metrics Card */}
                    <Card className="border border-slate-200/50 shadow-sm p-2">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Requests</span>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.serviceRequests?.total || 0}</h3>
                            </div>
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Wrench size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Pending: {stats?.serviceRequests?.pending || 0}</span>
                                <span className="text-emerald-600 font-bold">Finished: {stats?.serviceRequests?.completed || 0}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Audit Logs Activities Feed */}
                <div className="grid grid-cols-1 gap-6">
                    <Card className="border border-slate-200/50 shadow-sm p-4">
                        <CardHeader className="flex gap-2 items-center pb-4 border-b border-slate-100">
                            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-600">
                                <History size={16} />
                            </div>
                            <h2 className="text-md font-bold text-slate-800">Recent Administrative Logs</h2>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col gap-4">
                            {auditLogs.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    No administrative actions have been logged yet.
                                </div>
                            ) : (
                                <div className="relative border-l border-slate-200 pl-4 ml-3 flex flex-col gap-5">
                                    {auditLogs.map((log) => (
                                        <div key={log._id} className="relative">
                                            {/* timeline timeline indicator bullet */}
                                            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                                            
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide inline-block mr-2">
                                                        {log.action}
                                                    </span>
                                                    <p className="text-sm text-slate-600 font-medium mt-1">{log.details}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 font-bold block">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                                        By: {log.performedBy?.fullName || "System"} ({log.performedBy?.role})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
