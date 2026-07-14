import React, { useState, useEffect } from "react";
import { getPayments } from "../../api/billing";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import BillDetailsModal from "./BillDetailsModal";
import { 
  CreditCard, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle,
  Inbox
} from "lucide-react";
import Button from "../../components/ui/Button";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats calculation over all matching filters
  const [allPaymentsForStats, setAllPaymentsForStats] = useState([]);

  // Modals state
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      const params = {
        page,
        limit: 10,
        paymentMethod: methodFilter || undefined,
      };
      const res = await getPayments(params);
      if (res && res.success) {
        setPayments(res.payments || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load payment transaction history.");
    }
  };

  const fetchStatsPayments = async () => {
    try {
      const res = await getPayments({ limit: 1000 });
      if (res && res.success) {
        setAllPaymentsForStats(res.payments || []);
      }
    } catch (err) {
      console.error("Failed to load statistics ledger:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchPayments(), fetchStatsPayments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, methodFilter]);

  // Local Search filtering
  const filteredPayments = payments.filter(p => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.resident?.fullName?.toLowerCase().includes(term) ||
      p.resident?.email?.toLowerCase().includes(term) ||
      p.resident?.unitNumber?.toLowerCase().includes(term) ||
      p.resident?.block?.toLowerCase().includes(term) ||
      p.transactionId?.toLowerCase().includes(term)
    );
  });

  // Calculate statistics from the unpaginated list
  const totalCollected = allPaymentsForStats.reduce((sum, p) => sum + p.amountPaid, 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* 1. Header Title Banner */}
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          Financial Desk
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Payment Transactions
        </h2>
      </div>

      {/* 2. Collection Stats Quick stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 select-none">
        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-success/10 border border-success/20 rounded-[4px] text-success shrink-0">
            <CheckCircle className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Total Funds Collected</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5">
              {formatCurrency(totalCollected)}
            </h3>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-primary/5 p-4 rounded-md select-none">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Search Billed Flat / Txn Ref</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by resident name, block/flat, or txn ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
            />
            <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Payment Method</label>
          <Select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Methods" },
              { value: "online", label: "Online Gateway" },
              { value: "cash", label: "Cash Payment" },
              { value: "cheque", label: "Cheque Deposit" },
            ]}
          />
        </div>
      </div>

      {/* Stats counter */}
      {!loading && !error && (
        <div className="text-xs font-mono text-text/60 select-none">
          <span className="font-bold text-primary">Active transaction logs:</span>
          <span> {totalCount} payments logged matching filter</span>
        </div>
      )}

      {/* 4. Transactions List */}
      {loading ? (
        <PageLoader message="Fetching transaction receipts..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection failure: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={loadData} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Ledger Records
            </Button>
          </Card>
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Transactions Logged"
          description="There are no payment receipts matching your filters in the system database."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredPayments.map((p) => (
              <Card 
                key={p._id}
                onClick={() => {
                  setSelectedBill(p.bill);
                  setSelectedPayment(p);
                }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-12 h-12 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0 select-none">
                    <CreditCard className="w-5 h-5 text-text/30" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono tracking-wider uppercase bg-success/5 text-success border border-success/10 px-1.5 py-0.2 rounded-[2px]">
                        {p.bill?.category || "dues"}
                      </span>
                      <span className="text-[10px] font-mono text-text/40">Paid on: {formatDate(p.paymentDate)}</span>
                    </div>
                    <h3 className="font-display font-bold text-primary mt-1 group-hover:text-accent transition-colors truncate">
                      {p.resident?.fullName || "Resident User"} ({p.resident?.block}-{p.resident?.unitNumber}) — Paid {formatCurrency(p.amountPaid)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                      <span className="flex items-center gap-1">
                        Ref Period: {p.bill?.billingPeriod || "N/A"}
                      </span>
                      <span>•</span>
                      <span className="text-[10px]">Method: {p.paymentMethod}</span>
                      <span>•</span>
                      <span className="text-[10px]">Txn ID: {p.transactionId}</span>
                      <span>•</span>
                      <span className="text-[10px]">Recorded By: {p.recordedBy?.fullName || "System"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto shrink-0 select-none">
                  <StampBadge status="paid" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Receipt
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Details receipt Modal */}
      {selectedBill && (
        <BillDetailsModal
          bill={selectedBill}
          payment={selectedPayment}
          user={user}
          onClose={() => { setSelectedBill(null); setSelectedPayment(null); }}
        />
      )}

    </div>
  );
}
