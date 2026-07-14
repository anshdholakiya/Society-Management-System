import React, { useState, useEffect } from "react";
import { getAdminDashboard } from "../../api/dashboards";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { PageLoader } from "../../components/ui/Spinner";
import { 
  Users, 
  FileWarning, 
  Wrench, 
  DollarSign, 
  History, 
  TrendingUp, 
  ArrowRight,
  TrendingDown,
  UserSquare2,
  Clock,
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await getAdminDashboard();
      if (res && res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load dashboard statistics.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats().finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <PageLoader message="Assembling executive control dashboard stats..." />;
  }

  if (error) {
    return (
      <div className="w-full text-center py-12">
        <Card className="border-danger/30 p-8 max-w-xl mx-auto">
          <TrendingDown className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
          <h3 className="font-display font-bold text-lg text-primary mb-2">Dashboard Sync Failed</h3>
          <p className="text-sm text-text/80 leading-relaxed mb-6">
            Database connection failed: {error}
          </p>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const logs = dashboardData?.recentAuditLogs || [];

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          Society Control Desk
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Executive Admin Console
        </h2>
      </div>

      {/* Grid: 4 Top Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Total Funds Collected */}
        <Card className="flex items-center gap-4 bg-success/5 border border-success/15 py-4">
          <div className="p-3 bg-success/10 border border-success/20 rounded-[4px] text-success shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Total Funds Collected</span>
            <h3 className="text-2xl font-display font-extrabold text-success mt-0.5">
              {formatCurrency(stats.finance?.totalCollected)}
            </h3>
          </div>
        </Card>

        {/* Outstanding Dues */}
        <Card className="flex items-center gap-4 bg-danger/5 border border-danger/15 py-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-[4px] text-danger shrink-0">
            <TrendingDown className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Outstanding Dues</span>
            <h3 className="text-2xl font-display font-extrabold text-danger mt-0.5">
              {formatCurrency(stats.finance?.totalOutstanding)}
            </h3>
          </div>
        </Card>

        {/* Registered Residents */}
        <Link to="/admin/residents" className="block group">
          <Card className="flex items-center gap-4 bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10 py-4 h-full">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-[4px] text-primary group-hover:text-accent transition-colors shrink-0">
              <Users className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-text/50">Registered Residents</span>
              <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5 group-hover:text-accent transition-colors">
                {stats.users?.residents} residents
              </h3>
            </div>
          </Card>
        </Link>

        {/* Board Representatives */}
        <Link to="/admin/committee" className="block group">
          <Card className="flex items-center gap-4 bg-primary/5 hover:bg-primary/10 transition-all border border-primary/10 py-4 h-full">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-[4px] text-primary group-hover:text-accent transition-colors shrink-0">
              <UserSquare2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-text/50">Board Representatives</span>
              <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5 group-hover:text-accent transition-colors">
                {stats.users?.committee} members
              </h3>
            </div>
          </Card>
        </Link>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Operations Breakdown Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Module Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Complaints Summary */}
            <Card className="border border-primary/10 select-none">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-3 mb-4">
                <FileWarning className="w-5 h-5 text-accent" />
                <h4 className="font-display font-bold text-sm text-primary">Grievances Ledger</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-primary/5 p-2 rounded-[3px] border border-primary/10">
                  <span className="text-[10px] font-mono text-text/50 uppercase">Open</span>
                  <div className="text-lg font-display font-extrabold text-primary mt-1">{stats.complaints?.open}</div>
                </div>
                <div className="bg-warning/5 p-2 rounded-[3px] border border-warning/15">
                  <span className="text-[10px] font-mono text-text/50 uppercase">Assigned</span>
                  <div className="text-lg font-display font-extrabold text-warning mt-1">{stats.complaints?.assigned}</div>
                </div>
                <div className="bg-success/5 p-2 rounded-[3px] border border-success/15">
                  <span className="text-[10px] font-mono text-text/50 uppercase">Resolved</span>
                  <div className="text-lg font-display font-extrabold text-success mt-1">{stats.complaints?.resolved}</div>
                </div>
              </div>
              <Link to="/admin/complaints" className="mt-4 flex items-center justify-end gap-1 text-[11px] font-mono text-accent hover:underline">
                View Complaints board
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

            {/* Service Requests Summary */}
            <Card className="border border-primary/10 select-none">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-3 mb-4">
                <Wrench className="w-5 h-5 text-accent" />
                <h4 className="font-display font-bold text-sm text-primary">Service Requests</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-primary/5 p-2 rounded-[3px] border border-primary/10">
                  <span className="text-[10px] font-mono text-text/50 uppercase">Pending</span>
                  <div className="text-lg font-display font-extrabold text-primary mt-1">{stats.serviceRequests?.pending}</div>
                </div>
                <div className="bg-warning/5 p-2 rounded-[3px] border border-warning/15">
                  <span className="text-[10px] font-mono text-text/50 uppercase">In Progress</span>
                  <div className="text-lg font-display font-extrabold text-warning mt-1">{stats.serviceRequests?.inProgress}</div>
                </div>
                <div className="bg-success/5 p-2 rounded-[3px] border border-success/15">
                  <span className="text-[10px] font-mono text-text/50 uppercase">Done</span>
                  <div className="text-lg font-display font-extrabold text-success mt-1">{stats.serviceRequests?.completed}</div>
                </div>
              </div>
              <Link to="/admin/service-requests" className="mt-4 flex items-center justify-end gap-1 text-[11px] font-mono text-accent hover:underline">
                View Operations board
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Card>

          </div>

          {/* Quick Info Box */}
          <Card className="bg-primary/5 border border-primary/10 p-4 select-none">
            <h4 className="font-display font-bold text-sm text-primary flex items-center gap-1.5 mb-2">
              <Briefcase className="w-4 h-4 text-accent" />
              Operational Efficiency Overview
            </h4>
            <p className="text-xs text-text/75 leading-relaxed">
              Maintain full transparency by monitoring recent activity logs on the right panel. Review billing statuses regularly, mark manual payments via the billing desk, and assign open complaints promptly to committee members.
            </p>
          </Card>

        </div>

        {/* Right Side: Recent Activity Feed (Latest 5 logs) */}
        <div>
          <Card className="border border-primary/10 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                <h4 className="font-display font-bold text-sm text-primary">Recent Operations</h4>
              </div>
              <Link to="/admin/audit-logs" className="text-[10px] font-mono text-text/40 hover:text-accent hover:underline">
                View all
              </Link>
            </div>

            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-text/40 text-xs select-none">
                No recent actions recorded.
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px]">
                {logs.map((log) => (
                  <div 
                    key={log._id || log.id}
                    className="border-b border-primary/5 last:border-b-0 pb-3 last:pb-0 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 select-none">
                      <span className="font-mono font-bold text-[8px] bg-primary/5 text-primary border border-primary/10 px-1 py-0.2 rounded-[2px] uppercase">
                        {log.action?.replace("_", " ")}
                      </span>
                      <span className="text-[9px] font-mono text-text/40 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-text/30" />
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                    <p className="font-sans text-primary/80 font-medium leading-normal break-all">
                      {log.details}
                    </p>
                    <div className="text-[9px] font-mono text-text/40 select-none">
                      by: {log.performedBy?.fullName || "System"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}
