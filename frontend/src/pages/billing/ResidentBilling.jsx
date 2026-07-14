import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBills, recordPayment, getPayments } from "../../api/billing";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import BillDetailsModal from "./BillDetailsModal";
import { 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Calendar, 
  DollarSign, 
  X, 
  ShieldAlert,
  Wallet,
  Clock
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function ResidentBilling() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  
  // Tabs
  const [activeTab, setActiveTab] = useState(pathname.includes("payments") ? "payments" : "bills");

  // Sync active tab selection if location updates
  useEffect(() => {
    setActiveTab(pathname.includes("payments") ? "payments" : "bills");
  }, [pathname]);

  // Data States
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scoping params
  const [billPage, setBillPage] = useState(1);
  const [billTotalPages, setBillTotalPages] = useState(1);
  const [billFilter, setBillFilter] = useState(""); // "" | "unpaid" | "paid"

  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);

  // Modals & Gateway state
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Payment Gateway Simulator Modal State
  const [payingBill, setPayingBill] = useState(null);
  const [gatewayMethod, setGatewayMethod] = useState("upi");
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const fetchBillsData = async () => {
    try {
      const params = {
        page: billPage,
        limit: 10,
        status: billFilter || undefined,
      };
      const res = await getBills(params);
      if (res && res.success) {
        setBills(res.bills || []);
        setBillTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load outstanding invoices.");
    }
  };

  const fetchPaymentsData = async () => {
    try {
      const params = {
        page: paymentPage,
        limit: 10,
      };
      const res = await getPayments(params);
      if (res && res.success) {
        setPayments(res.payments || []);
        setPaymentTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load payment logs.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === "bills") {
      await fetchBillsData();
    } else {
      await fetchPaymentsData();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, billPage, billFilter, paymentPage]);

  // Totals calculations based on bills
  const outstandingBills = bills.filter(b => b.status === "unpaid");
  const outstandingCount = outstandingBills.length;
  const outstandingAmount = outstandingBills.reduce((sum, b) => sum + b.amount, 0);

  const handlePayClick = (bill, e) => {
    e.stopPropagation();
    setPayingBill(bill);
    setGatewayMethod("upi");
  };

  const handleSimulatePaymentSubmit = async (e) => {
    e.preventDefault();
    setSimulatingPayment(true);
    const toastId = toast.loading("Connecting to secure gateway server...");
    
    // Simulate gateway handoff
    setTimeout(async () => {
      try {
        const payload = {
          bill: payingBill._id,
          amountPaid: payingBill.amount,
          paymentMethod: "online",
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        };
        await recordPayment(payload);
        toast.success("Payment verified! Receipt logged.", { id: toastId });
        setPayingBill(null);
        setBillPage(1);
        setActiveTab("payments");
        setPaymentPage(1);
        await fetchPaymentsData();
      } catch (err) {
        toast.error(err.message || "Gateway processing aborted.", { id: toastId });
      } finally {
        setSimulatingPayment(false);
      }
    }, 2000);
  };

  const handleDetailsClick = (bill, e) => {
    e.stopPropagation();
    setSelectedBill(bill);
    
    // Sync payment if details are fetched
    if (bill.status === "paid") {
      const match = payments.find(p => p.bill?._id === bill._id);
      if (match) setSelectedPayment(match);
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
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          Resident Corner
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Society Invoices & Payments
        </h2>
      </div>

      {/* 2. Outstanding Invoices Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 select-none">
        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-[4px] text-accent shrink-0">
            <Clock className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Unpaid Invoices</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5">
              {outstandingCount} bills
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-primary/5 border border-primary/10 py-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-[4px] text-danger shrink-0">
            <Wallet className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-text/50">Outstanding Amount</span>
            <h3 className="text-2xl font-display font-extrabold text-primary mt-0.5">
              {formatCurrency(outstandingAmount)}
            </h3>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-primary/10 select-none">
        <button
          onClick={() => { setActiveTab("bills"); setBillPage(1); }}
          className={`px-6 py-2.5 font-display font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "bills" 
              ? "border-accent text-accent" 
              : "border-transparent text-text/50 hover:text-primary"
          }`}
        >
          My Invoices
        </button>
        <button
          onClick={() => { setActiveTab("payments"); setPaymentPage(1); }}
          className={`px-6 py-2.5 font-display font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "payments" 
              ? "border-accent text-accent" 
              : "border-transparent text-text/50 hover:text-primary"
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Tab filter operations (only shown for bills) */}
      {activeTab === "bills" && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
          <div className="text-xs font-mono text-text/60">
            <span>Filter and process invoices matching flat logs.</span>
          </div>

          <div className="w-full sm:w-48">
            <Select
              placeholder="All Bills"
              value={billFilter}
              onChange={(e) => {
                setBillFilter(e.target.value);
                setBillPage(1);
              }}
              options={[
                { value: "", label: "All Bills" },
                { value: "unpaid", label: "Unpaid" },
                { value: "paid", label: "Paid" },
              ]}
            />
          </div>
        </div>
      )}

      {/* 4. Tab Content Panels */}
      {loading ? (
        <PageLoader message="Querying ledger databases..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Details: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={loadData} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Tab Index
            </Button>
          </Card>
        </div>
      ) : activeTab === "bills" && bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={billFilter ? "No Bills Match Filter" : "No Invoices Logged"}
          description={billFilter ? "No matching bills found under this query." : "Congratulations! Your account has no generated bills registered yet."}
        />
      ) : activeTab === "payments" && payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Transaction Logs"
          description="Your payment history ledger sheet is currently blank."
        />
      ) : activeTab === "bills" ? (
        
        /* ------------------ BILLS LIST ------------------ */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {bills.map((b) => {
              const overdue = b.status === "unpaid" && new Date(b.dueDate) < new Date();
              const badgeStatus = b.status === "paid" ? "paid" : (overdue ? "overdue" : "pending");

              return (
                <Card 
                  key={b._id} 
                  onClick={(e) => handleDetailsClick(b, e)}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="w-12 h-12 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0 select-none">
                      <Receipt className="w-5 h-5 text-text/30" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono tracking-wider uppercase bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.2 rounded-[2px]">
                          {b.category || "maintenance"}
                        </span>
                        <span className="text-[10px] font-mono text-text/40">Invoice for: {b.billingPeriod}</span>
                      </div>
                      <h3 className="font-display font-bold text-primary group-hover:text-accent transition-colors truncate mt-1">
                        Dues: {formatCurrency(b.amount)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {formatDate(b.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 select-none">
                    <StampBadge status={badgeStatus} />
                    
                    {b.status === "unpaid" && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={(e) => handlePayClick(b, e)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Now
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => handleDetailsClick(b, e)}
                      className="hidden sm:flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Invoice
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {billTotalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={billPage}
                totalPages={billTotalPages}
                onPageChange={(p) => setBillPage(p)}
              />
            </div>
          )}
        </div>
      ) : (

        /* ------------------ PAYMENTS LIST ------------------ */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {payments.map((p) => (
              <Card 
                key={p._id} 
                onClick={() => {
                  setSelectedBill(p.bill);
                  setSelectedPayment(p);
                }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
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
                    <h3 className="font-display font-bold text-primary group-hover:text-accent transition-colors truncate mt-1">
                      Payment of {formatCurrency(p.amountPaid)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                      <span className="flex items-center gap-1">
                        Ref period: {p.bill?.billingPeriod || "N/A"}
                      </span>
                      <span>•</span>
                      <span className="text-[10px]">Method: {p.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 select-none">
                  <StampBadge status="paid" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Receipt Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {paymentTotalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={paymentPage}
                totalPages={paymentTotalPages}
                onPageChange={(p) => setPaymentPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. Simulated Payment Gateway Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-md w-full relative flex flex-col shadow-lg animate-fade-in text-left">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Secure Payment Gateway</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Pay Bill Invoice</h4>
              </div>
              <button 
                onClick={() => setPayingBill(null)}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={simulatingPayment}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSimulatePaymentSubmit} className="p-6 space-y-4 font-sans">
              
              {/* Alert Warning Box */}
              <div className="border border-warning/30 bg-warning/5 p-3.5 rounded-[3px] flex gap-2 select-none">
                <ShieldAlert className="w-5 h-5 text-warning shrink-0 stroke-[1.5]" />
                <div>
                  <h5 className="text-xs font-mono font-bold text-warning uppercase">Sandbox Mode Alert</h5>
                  <p className="text-[10px] text-warning/90 mt-0.5 leading-relaxed">
                    SANDBOX TEST MODE — No real money is transacted. Clicking pay will record a simulated transaction instantly in the ledger database.
                  </p>
                </div>
              </div>

              {/* Bill Details Summary */}
              <div className="p-4 border border-primary/10 rounded-[3px] bg-primary/5 space-y-2 select-none">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text/50">Billing Period:</span>
                  <span className="font-bold text-primary">{payingBill.billingPeriod}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text/50">Category:</span>
                  <span className="font-bold text-primary uppercase">{payingBill.category || "maintenance"}</span>
                </div>
                <div className="flex justify-between border-t border-primary/10 pt-2 text-sm font-display font-extrabold">
                  <span className="text-primary">Total Pay Amount:</span>
                  <span className="text-accent">{formatCurrency(payingBill.amount)}</span>
                </div>
              </div>

              {/* Gateway Channel Selector */}
              <div className="flex flex-col gap-1 select-none">
                <label className="text-xs font-semibold text-primary/60">Choose Payment Channel</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={`border border-primary/10 rounded-[4px] p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    gatewayMethod === "upi" ? "bg-accent/5 border-accent text-accent" : "hover:bg-primary/5 text-text/60"
                  }`}>
                    <input 
                      type="radio" 
                      name="gateway-channel" 
                      value="upi"
                      checked={gatewayMethod === "upi"}
                      onChange={() => setGatewayMethod("upi")}
                      className="hidden"
                      disabled={simulatingPayment}
                    />
                    <DollarSign className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-xs font-semibold mt-1">Pay via UPI</span>
                  </label>
                  
                  <label className={`border border-primary/10 rounded-[4px] p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    gatewayMethod === "card" ? "bg-accent/5 border-accent text-accent" : "hover:bg-primary/5 text-text/60"
                  }`}>
                    <input 
                      type="radio" 
                      name="gateway-channel" 
                      value="card"
                      checked={gatewayMethod === "card"}
                      onChange={() => setGatewayMethod("card")}
                      className="hidden"
                      disabled={simulatingPayment}
                    />
                    <CreditCard className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-xs font-semibold mt-1">Credit / Debit Card</span>
                  </label>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setPayingBill(null)}
                  disabled={simulatingPayment}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={simulatingPayment}
                  className="gap-2 min-w-32"
                >
                  {simulatingPayment ? <Spinner size="sm" /> : "Complete Pay"}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Invoice Details Modal */}
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
