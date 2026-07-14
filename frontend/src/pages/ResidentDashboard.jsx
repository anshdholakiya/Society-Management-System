import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, Button, Spinner } from "@heroui/react";
import { Landmark, AlertTriangle, ShieldCheck, Wrench, ShieldAlert, History, Activity, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

export default function ResidentDashboard() {
    const [summary, setSummary] = useState(null);
    const [outstandingBills, setOutstandingBills] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [activeComplaints, setActiveComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get("/api/dashboards/resident");
                if (response.data?.success) {
                    setSummary(response.data.summary);
                    setOutstandingBills(response.data.outstandingBills || []);
                    setRecentPayments(response.data.recentPayments || []);
                    setActiveComplaints(response.data.activeComplaints || []);
                } else {
                    toast.error("Failed to load dashboard metrics.");
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "An error occurred fetching dashboard summary.");
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
                    <Spinner size="lg" color="primary" label="Assembling dashboard..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header Title Banner */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resident Dashboard</h1>
                        <p className="text-sm text-slate-500">Overview of your account balances, recent payments, and active requests</p>
                    </div>
                </div>

                {/* Grid Analytics Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Financial Summary card Widget */}
                    <Card className="border border-slate-200/50 shadow-sm p-2 bg-gradient-to-br from-white to-slate-50/50">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
                                <h3 className={`text-2xl font-bold mt-1 ${summary?.outstandingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                    ₹{summary?.outstandingAmount?.toLocaleString() || 0}
                                </h3>
                            </div>
                            <div className={`p-2.5 rounded-xl ${summary?.outstandingAmount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                <Landmark size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Unpaid Invoices:</span>
                                <span>{summary?.outstandingCount || 0} bills pending</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active complaints counter card Widget */}
                    <Card className="border border-slate-200/50 shadow-sm p-2 bg-gradient-to-br from-white to-slate-50/50">
                        <CardHeader className="flex gap-3 justify-between items-start pb-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Complaints</span>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeComplaints.length}</h3>
                            </div>
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-[11px] text-slate-500 font-semibold flex justify-between border-t border-slate-100 pt-2">
                                <span>Status:</span>
                                <span>Awaiting resolution / assigned</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sub-sections columns grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Unpaid Bills List */}
                    <Card className="border border-slate-200/50 shadow-sm p-4">
                        <CardHeader className="flex gap-2 items-center pb-4 border-b border-slate-100">
                            <FileText size={18} className="text-slate-500" />
                            <h2 className="text-md font-bold text-slate-800">Unpaid Invoices</h2>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {outstandingBills.length === 0 ? (
                                <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
                                    <ShieldCheck className="text-emerald-500" size={32} />
                                    <span className="text-sm font-semibold text-slate-700">All dues cleared!</span>
                                    <span className="text-xs text-slate-400">There are no outstanding bills on your account.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {outstandingBills.map((bill) => (
                                        <div key={bill._id} className="flex justify-between items-center p-3 bg-rose-50/20 border border-rose-100/50 rounded-xl">
                                            <div>
                                                <span className="font-semibold text-slate-800 text-sm block">{bill.billingPeriod}</span>
                                                <span className="text-[10px] text-slate-400 font-bold block">Due Date: {new Date(bill.dueDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-rose-600 text-md block">₹{bill.amount}</span>
                                                <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block mt-1 inline-block">Unpaid</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Complaints trackers */}
                    <Card className="border border-slate-200/50 shadow-sm p-4">
                        <CardHeader className="flex gap-2 items-center pb-4 border-b border-slate-100">
                            <ShieldAlert size={18} className="text-slate-500" />
                            <h2 className="text-md font-bold text-slate-800">Active Complaints Tracker</h2>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {activeComplaints.length === 0 ? (
                                <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
                                    <ShieldCheck className="text-indigo-500" size={32} />
                                    <span className="text-sm font-semibold text-slate-700">No active complaints</span>
                                    <span className="text-xs text-slate-400">All your complaints are resolved or closed.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {activeComplaints.map((complaint) => (
                                        <div key={complaint._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/40 rounded-xl">
                                            <div>
                                                <span className="font-semibold text-slate-800 text-sm block">{complaint.title}</span>
                                                <span className="text-[10px] text-slate-400 font-bold block">Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs capitalize font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                                                    {complaint.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Payments history Ledger */}
                <Card className="border border-slate-200/50 shadow-sm p-4">
                    <CardHeader className="flex gap-2 items-center pb-4 border-b border-slate-100">
                        <History size={18} className="text-slate-500" />
                        <h2 className="text-md font-bold text-slate-800">Recent Payment Ledger</h2>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {recentPayments.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                No payment history found on your ledger records.
                            </div>
                        ) : (
                            <div className="overflow-x-auto font-sans">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Period</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Paid</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Code</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.map((payment) => (
                                            <tr key={payment._id} className="border-b border-slate-100/50 hover:bg-slate-50/20">
                                                <td className="py-3 text-sm font-semibold text-slate-800">{payment.bill?.billingPeriod || "N/A"}</td>
                                                <td className="py-3 text-xs text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                                <td className="py-3 text-xs text-slate-600 capitalize">{payment.paymentMethod}</td>
                                                <td className="py-3 text-xs font-mono text-slate-500">{payment.transactionId || "-"}</td>
                                                <td className="py-3 text-sm font-bold text-emerald-600 text-right">₹{payment.amountPaid}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
