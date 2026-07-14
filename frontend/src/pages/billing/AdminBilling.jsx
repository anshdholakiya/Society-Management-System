import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { getBills, createBill, bulkGenerateBills, recordPayment, deleteBill, getPayments } from "../../api/billing";
import { getResidents } from "../../api/users";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import BillDetailsModal from "./BillDetailsModal";
import { 
  Plus, 
  Receipt, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle,
  Clock,
  Wallet,
  X,
  CreditCard
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminBilling() {
  const { user } = useAuth();
  
  // Data States
  const [bills, setBills] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats calculation over all matching filters
  const [allBillsForStats, setAllBillsForStats] = useState([]);

  // Modals state
  const [isSingleBillOpen, setIsSingleBillOpen] = useState(false);
  const [isBulkBillOpen, setIsBulkBillOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Manual Payment Recording Modal State
  const [recordingPaymentBill, setRecordingPaymentBill] = useState(null);
  const [manualMethod, setManualMethod] = useState("cash");
  const [manualTxnId, setManualTxnId] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Forms
  const {
    register: registerSingle,
    handleSubmit: handleSubmitSingle,
    reset: resetSingle,
    formState: { errors: errorsSingle },
  } = useForm({
    defaultValues: {
      resident: "",
      amount: "",
      dueDate: "",
      billingPeriod: "",
      category: "maintenance",
    }
  });

  const {
    register: registerBulk,
    handleSubmit: handleSubmitBulk,
    reset: resetBulk,
    formState: { errors: errorsBulk },
  } = useForm({
    defaultValues: {
      amount: "",
      dueDate: "",
      billingPeriod: "",
      category: "maintenance",
    }
  });

  const fetchBills = async () => {
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      };
      const res = await getBills(params);
      if (res && res.success) {
        setBills(res.bills || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load system billing ledger.");
    }
  };

  const fetchStatsBills = async () => {
    try {
      // Fetch a larger limit to calculate true statistics over active records
      const res = await getBills({ limit: 1000 });
      if (res && res.success) {
        setAllBillsForStats(res.bills || []);
      }
    } catch (err) {
      console.error("Failed to load statistics ledger:", err);
    }
  };

  const fetchResidentList = async () => {
    try {
      const res = await getResidents({ limit: 100 });
      if (res && res.success) {
        setResidents(res.users || []);
      }
    } catch (err) {
      console.error("Failed to load resident drop list:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchBills(), fetchStatsBills(), fetchResidentList()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, categoryFilter]);

  // Local Filtered Search mapping
  const filteredBills = bills.filter(b => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      b.resident?.fullName?.toLowerCase().includes(term) ||
      b.resident?.email?.toLowerCase().includes(term) ||
      b.resident?.unitNumber?.toLowerCase().includes(term) ||
      b.resident?.block?.toLowerCase().includes(term)
    );
  });

  // Calculate statistics from the unpaginated list
  const totalCollected = allBillsForStats
    .filter(b => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalOutstanding = allBillsForStats
    .filter(b => b.status === "unpaid")
    .reduce((sum, b) => sum + b.amount, 0);

  const overdueCount = allBillsForStats
    .filter(b => b.status === "unpaid" && new Date(b.dueDate) < new Date())
    .length;

  const handleSingleBillSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading("Writing bill to database ledger...");
    try {
      await createBill({
        resident: data.resident,
        amount: Number(data.amount),
        dueDate: data.dueDate,
        billingPeriod: data.billingPeriod.trim(),
        category: data.category,
      });
      toast.success("Bill created successfully!", { id: toastId });
      setIsSingleBillOpen(false);
      resetSingle();
      setPage(1);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create invoice record.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkBillSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading("Bulk generating invoice entries...");
    try {
      const res = await bulkGenerateBills({
        amount: Number(data.amount),
        dueDate: data.dueDate,
        billingPeriod: data.billingPeriod.trim(),
        category: data.category,
      });
      toast.success(`Generated: ${res.createdCount} entries, Skipped duplicate: ${res.skippedCount}`, { id: toastId });
      setIsBulkBillOpen(false);
      resetBulk();
      setPage(1);
      loadData();
    } catch (err) {
      toast.error(err.message || "Bulk generation process aborted.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordManualPaymentSubmit = async (e) => {
    e.preventDefault();
    if (["online", "cheque"].includes(manualMethod) && !manualTxnId.trim()) {
      toast.error("Cheque reference/Transaction ID is required");
      return;
    }

    setRecordingPayment(true);
    const toastId = toast.loading("Recording transaction ledger sheet...");
    try {
      const payload = {
        bill: recordingPaymentBill._id,
        amountPaid: recordingPaymentBill.amount,
        paymentMethod: manualMethod,
        transactionId: manualTxnId.trim() || `MANUAL_${Date.now()}`,
      };
      await recordPayment(payload);
      toast.success("Offline payment recorded successfully!", { id: toastId });
      setRecordingPaymentBill(null);
      setManualTxnId("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to record manual payment.", { id: toastId });
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteBill = async (billId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this billing record? This is irreversible.")) {
      return;
    }
    const toastId = toast.loading("Deleting bill document...");
    try {
      await deleteBill(billId);
      toast.success("Bill deleted successfully.", { id: toastId });
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete bill.", { id: toastId });
    }
  };

  const handleDetailsClick = async (bill) => {
    setSelectedBill(bill);
    if (bill.status === "paid") {
      try {
        const res = await getPayments({ limit: 100 });
        if (res && res.success) {
          const match = res.payments.find(p => p.bill?._id === bill._id);
          if (match) setSelectedPayment(match);
        }
      } catch (err) {
        console.error("Failed to load payment matching logs:", err);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
      
      {/* 1. Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4 select-none">
        <div>
          <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
            Management Desk
          </span>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
            Ledger Dues & Billing
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setIsBulkBillOpen(true)} className="gap-2 text-xs py-2">
            Bulk Generate
          </Button>
          <Button variant="primary" onClick={() => setIsSingleBillOpen(true)} className="gap-2 text-xs py-2">
            <Plus className="w-4 h-4" />
            Create Bill
          </Button>
        </div>
      </div>

      {/* 2. Collection Summary statistics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 select-none">
        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-success/10 border border-success/20 rounded-[4px] text-success shrink-0">
            <CheckCircle className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Total Collected</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5">
              {formatCurrency(totalCollected)}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-[4px] text-accent shrink-0">
            <Wallet className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Total Outstanding</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5">
              {formatCurrency(totalOutstanding)}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-[4px] text-danger shrink-0">
            <Clock className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Overdue Invoices</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5 text-danger animate-pulse">
              {overdueCount} cases
            </h3>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-primary/5 p-4 rounded-md select-none">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Search Resident Unit</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by resident name or flat/block..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
            />
            <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Category</label>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              { value: "maintenance", label: "Maintenance" },
              { value: "water", label: "Water" },
              { value: "electricity", label: "Electricity" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Bills" },
              { value: "unpaid", label: "Unpaid" },
              { value: "paid", label: "Paid" },
            ]}
          />
        </div>
      </div>

      {/* Stats counter */}
      {!loading && !error && (
        <div className="text-xs font-mono text-text/60 select-none">
          <span className="font-bold text-primary">Active records:</span>
          <span> {totalCount} invoices returned matching queries</span>
        </div>
      )}

      {/* 4. Billing List */}
      {loading ? (
        <PageLoader message="Fetching billing ledger registries..." />
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
              Reload Billing Desk
            </Button>
          </Card>
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Billing Invoices Found"
          description="There are no dues documents registered matching your query filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredBills.map((b) => {
              const overdue = b.status === "unpaid" && new Date(b.dueDate) < new Date();
              const badgeStatus = b.status === "paid" ? "paid" : (overdue ? "overdue" : "pending");

              return (
                <Card 
                  key={b._id} 
                  onClick={() => handleDetailsClick(b)}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="w-12 h-12 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0 select-none">
                      <Receipt className="w-5 h-5 text-text/30" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono tracking-wider uppercase bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.2 rounded-[2px]">
                          {b.category || "dues"}
                        </span>
                        <span className="text-[10px] font-mono text-text/40">Period: {b.billingPeriod}</span>
                      </div>
                      <h3 className="font-display font-bold text-primary mt-1 group-hover:text-accent transition-colors truncate">
                        {b.resident?.fullName || "Resident User"} ({b.resident?.block}-{b.resident?.unitNumber}) — {formatCurrency(b.amount)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {formatDate(b.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                    <StampBadge status={badgeStatus} />
                    
                    {b.status === "unpaid" && (
                      <>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => setRecordingPaymentBill(b)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Mark Paid
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleDeleteBill(b._id, e)}
                          className="p-1.5 text-text/40 hover:text-danger cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDetailsClick(b)}
                      className="hidden sm:flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Invoice
                    </Button>
                  </div>
                </Card>
              );
            })}
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

      {/* 5. Create Single Bill Modal */}
      {isSingleBillOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-md w-full relative flex flex-col shadow-lg animate-fade-in text-left">
            
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Ledger Dispatch</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Create Unit Invoice Dues</h4>
              </div>
              <button 
                onClick={() => { setIsSingleBillOpen(false); resetSingle(); }}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingle(handleSingleBillSubmit)} className="p-6 space-y-4 font-sans">
              <Select
                label="Resident Owner Account"
                error={errorsSingle.resident?.message}
                disabled={submitting}
                {...registerSingle("resident", { required: "Please select target resident unit" })}
                options={[
                  { value: "", label: "Choose Resident..." },
                  ...residents.map(r => ({
                    value: r._id,
                    label: `${r.fullName} (${r.block}-${r.unitNumber})`
                  }))
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  disabled={submitting}
                  {...registerSingle("category")}
                  options={[
                    { value: "maintenance", label: "Maintenance" },
                    { value: "water", label: "Water" },
                    { value: "electricity", label: "Electricity" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <Input
                  label="Dues Amount (INR)"
                  placeholder="e.g. 2500"
                  type="number"
                  error={errorsSingle.amount?.message}
                  disabled={submitting}
                  {...registerSingle("amount", { 
                    required: "Amount is required",
                    min: { value: 1, message: "Must be positive amount" }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Billing Period"
                  placeholder="e.g. July 2026"
                  error={errorsSingle.billingPeriod?.message}
                  disabled={submitting}
                  {...registerSingle("billingPeriod", { required: "Billing period is required" })}
                />
                <Input
                  label="Due Date"
                  type="date"
                  error={errorsSingle.dueDate?.message}
                  disabled={submitting}
                  {...registerSingle("dueDate", { required: "Due date is required" })}
                />
              </div>

              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setIsSingleBillOpen(false); resetSingle(); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting}
                  className="gap-2 min-w-32"
                >
                  {submitting ? <Spinner size="sm" /> : "Dispatch Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Bulk Generate Bills Modal */}
      {isBulkBillOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-md w-full relative flex flex-col shadow-lg animate-fade-in text-left">
            
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Batch Engine</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Bulk Auto-Generate Monthly Invoices</h4>
              </div>
              <button 
                onClick={() => { setIsBulkBillOpen(false); resetBulk(); }}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBulk(handleBulkBillSubmit)} className="p-6 space-y-4 font-sans">
              
              <div className="border border-primary/10 bg-primary/5 p-3 rounded-[3px] text-[10px] font-mono text-primary select-none">
                This utility creates billing invoices for ALL active resident units in the system database. Duplicate parameters are safely ignored.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  disabled={submitting}
                  {...registerBulk("category")}
                  options={[
                    { value: "maintenance", label: "Maintenance" },
                    { value: "water", label: "Water" },
                    { value: "electricity", label: "Electricity" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <Input
                  label="Dues Amount (INR)"
                  placeholder="e.g. 2000"
                  type="number"
                  error={errorsBulk.amount?.message}
                  disabled={submitting}
                  {...registerBulk("amount", { 
                    required: "Amount is required",
                    min: { value: 1, message: "Must be positive amount" }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Billing Period"
                  placeholder="e.g. July 2026"
                  error={errorsBulk.billingPeriod?.message}
                  disabled={submitting}
                  {...registerBulk("billingPeriod", { required: "Billing period is required" })}
                />
                <Input
                  label="Due Date"
                  type="date"
                  error={errorsBulk.dueDate?.message}
                  disabled={submitting}
                  {...registerBulk("dueDate", { required: "Due date is required" })}
                />
              </div>

              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setIsBulkBillOpen(false); resetBulk(); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting}
                  className="gap-2 min-w-32"
                >
                  {submitting ? <Spinner size="sm" /> : "Run Bulk Engine"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Record Manual Payment Modal */}
      {recordingPaymentBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-sm w-full relative flex flex-col shadow-lg animate-fade-in text-left">
            
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Ledger Desk</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Record Manual Payment</h4>
              </div>
              <button 
                onClick={() => { setRecordingPaymentBill(null); setManualTxnId(""); }}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={recordingPayment}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordManualPaymentSubmit} className="p-6 space-y-4 font-sans">
              <div className="p-3 border border-primary/10 rounded-[3px] bg-primary/5 text-xs font-mono select-none space-y-1">
                <div><span className="text-text/50">Resident:</span> <span className="font-bold text-primary">{recordingPaymentBill.resident?.fullName}</span></div>
                <div><span className="text-text/50">Unit:</span> <span className="font-bold text-primary">{recordingPaymentBill.resident?.block}-{recordingPaymentBill.resident?.unitNumber}</span></div>
                <div><span className="text-text/50">Amount:</span> <span className="font-bold text-accent">{formatCurrency(recordingPaymentBill.amount)}</span></div>
              </div>

              <Select
                label="Payment Method"
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value)}
                disabled={recordingPayment}
                options={[
                  { value: "cash", label: "Cash Payment" },
                  { value: "cheque", label: "Cheque Deposit" },
                  { value: "online", label: "Bank Wire Transfer" },
                ]}
              />

              {["online", "cheque"].includes(manualMethod) && (
                <Input
                  label="Cheque Ref / Transaction Ref ID"
                  placeholder="e.g. CHQ_98231 or TXN_8842"
                  value={manualTxnId}
                  onChange={(e) => setManualTxnId(e.target.value)}
                  disabled={recordingPayment}
                  required
                />
              )}

              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setRecordingPaymentBill(null); setManualTxnId(""); }}
                  disabled={recordingPayment}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={recordingPayment}
                  className="gap-2 min-w-32"
                >
                  {recordingPayment ? <Spinner size="sm" /> : "Confirm Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Invoice Details Modal */}
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
