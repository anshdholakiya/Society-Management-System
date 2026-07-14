import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getResidentDashboard } from "../../api/dashboards";
import Button from "../../components/ui/Button";
import StampBadge from "../../components/ui/StampBadge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";
import { 
  Receipt, 
  History, 
  AlertTriangle, 
  TrendingUp, 
  CreditCard,
  ChevronRight,
  RefreshCw
} from "lucide-react";

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getResidentDashboard();
      if (res && res.success) {
        setData(res);
      } else {
        throw new Error("Failed to load dashboard data");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return <PageLoader message="Consulting resident ledger columns..." />;
  }

  if (error) {
    return (
      <div className="w-full max-w-xl py-12 text-center animate-fade-in font-sans">
        <Card className="border-danger/30 p-8">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
          <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Fetch Failed</h3>
          <p className="text-sm text-text/80 mb-6 leading-relaxed">
            The database was unreachable or returned an invalid response code: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
          </p>
          <Button variant="primary" onClick={fetchDashboardData} className="gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const { summary, outstandingBills = [], recentPayments = [], activeComplaints = [] } = data || {};

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-8">
      {/* 1. Header Greeting */}
      <div>
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider select-none">
          Notice-Board Corner
        </span>
        <h2 className="text-3xl font-display font-black text-primary tracking-tight mt-1">
          Welcome back, {user?.fullName}
        </h2>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-accent border-y-primary/10 border-r-primary/10">
          <div className="w-12 h-12 rounded-sm bg-accent/5 flex items-center justify-center text-accent">
            <Receipt className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text/50 tracking-wider">Unresolved Invoices</span>
            <p className="font-mono text-2xl font-bold text-primary mt-0.5">
              {summary?.outstandingCount || 0} <span className="text-sm font-sans text-text/75 font-medium">Pending</span>
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-danger border-y-primary/10 border-r-primary/10">
          <div className="w-12 h-12 rounded-sm bg-danger/5 flex items-center justify-center text-danger">
            <CreditCard className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text/50 tracking-wider">Outstanding Dues</span>
            <p className="font-mono text-2xl font-bold text-primary mt-0.5">
              {formatCurrency(summary?.outstandingAmount)}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Main Notice Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Outstanding Bills */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-primary/10 pb-2">
            <h3 className="font-display font-bold text-lg text-primary">Outstanding Bills</h3>
            <Link to="/resident/bills" className="text-xs font-mono text-accent hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {outstandingBills.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="All Caught Up"
              description="No outstanding maintenance invoices recorded. Your account balance is clear."
            />
          ) : (
            <div className="space-y-3">
              {outstandingBills.map((bill) => (
                <Link to="/resident/bills" key={bill._id} className="block group">
                  <Card className="flex items-center justify-between py-3 hover:bg-surface/60 group-hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-display font-semibold text-primary">{bill.billingPeriod}</p>
                      <p className="text-xs text-text/60 font-mono mt-0.5">Due: {formatDate(bill.dueDate)}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-text">
                        {formatCurrency(bill.amount)}
                      </span>
                      <StampBadge status="Unpaid" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Cleared Payments */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-primary/10 pb-2">
            <h3 className="font-display font-bold text-lg text-primary">Recent Cleared Payments</h3>
            <Link to="/resident/payments" className="text-xs font-mono text-accent hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Payment Records"
              description="No transaction logs have been recorded under your resident account yet."
            />
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <Link to="/resident/payments" key={payment._id} className="block group">
                  <Card className="flex items-center justify-between py-3 hover:bg-surface/60 group-hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-display font-semibold text-primary">
                        Cleared {payment.bill?.billingPeriod || "Maintenance"}
                      </p>
                      <p className="text-xs text-text/60 font-mono mt-0.5">
                        {formatDate(payment.paymentDate)} via {payment.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-text">
                        {formatCurrency(payment.amountPaid)}
                      </span>
                      <StampBadge status="Paid" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Complaints */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex justify-between items-end border-b border-primary/10 pb-2">
            <h3 className="font-display font-bold text-lg text-primary">Active Grievances</h3>
            <Link to="/resident/complaints" className="text-xs font-mono text-accent hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {activeComplaints.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Active Grievances"
              description="There are currently no open or assigned complaints registered to your flat unit."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeComplaints.map((complaint) => (
                <Link to="/resident/complaints" key={complaint._id} className="block group">
                  <Card className="h-full flex flex-col justify-between py-4 hover:bg-surface/60 group-hover:border-primary/20 transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-display font-semibold text-primary line-clamp-1">{complaint.title}</p>
                        <StampBadge status={complaint.status} />
                      </div>
                      <p className="text-xs text-text/70 line-clamp-2 mb-4">{complaint.description}</p>
                    </div>
                    <div className="border-t border-primary/5 pt-2 flex items-center justify-between text-xs text-text/50 font-mono">
                      <span>Ref ID: #{complaint._id?.slice(-6)}</span>
                      <span>{formatDate(complaint.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
