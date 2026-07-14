import React from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { X, Calendar, User, CreditCard, Receipt, Printer, Landmark, DollarSign } from "lucide-react";

export default function BillDetailsModal({ bill, payment, user, onClose }) {
  
  const isOverdue = bill.status === "unpaid" && new Date(bill.dueDate) < new Date();
  const displayStatus = bill.status === "paid" ? "paid" : (isOverdue ? "overdue" : "pending");

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-surface border border-primary/20 rounded-md max-w-lg w-full relative flex flex-col shadow-lg animate-fade-in text-left print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header Bar - Hidden on print */}
        <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none print:hidden">
          <div>
            <span className="font-mono text-[10px] tracking-wider uppercase text-text/50">Invoice Sheet</span>
            <h4 className="font-display font-bold text-sm text-primary -mt-0.5">
              Invoice: #{bill._id?.slice(-8).toUpperCase()}
            </h4>
          </div>
          <button 
            onClick={onClose} 
            className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 space-y-6 font-sans print:p-0">
          
          {/* Header Banner */}
          <div className="flex justify-between items-start gap-4 border-b border-primary/10 pb-4">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-primary leading-tight">
                Society Dues Invoice
              </h2>
              <p className="text-xs text-text/50 font-mono mt-1">
                Generated on: {formatDate(bill.createdAt)}
              </p>
            </div>
            <StampBadge status={displayStatus} className="scale-110 select-none" />
          </div>

          {/* Unit & Resident Details */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-primary/5 p-4 border border-primary/10 rounded-[3px]">
            <div>
              <span className="text-[10px] font-mono uppercase text-text/50 select-none">Billed To</span>
              <p className="font-bold text-primary mt-0.5">{bill.resident?.fullName}</p>
              <p className="text-xs text-text/80 font-mono mt-0.5">
                Unit: {bill.resident?.block}-{bill.resident?.unitNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-text/50 select-none">Invoice Period</span>
              <p className="font-bold text-primary mt-0.5">{bill.billingPeriod}</p>
              <p className="text-xs text-text/80 font-mono mt-0.5">
                Due: {formatDate(bill.dueDate)}
              </p>
            </div>
          </div>

          {/* Bill breakdown itemized ledger list */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-text/50 select-none">Itemized Ledger Details</span>
            <div className="border border-primary/10 rounded-[3px] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-primary/5 font-mono text-[10px] text-text/60 border-b border-primary/10 uppercase">
                  <tr>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5 font-sans">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-primary">
                      Society {bill.category?.charAt(0).toUpperCase() + bill.category?.slice(1)} Dues
                    </td>
                    <td className="px-4 py-3 uppercase font-mono text-[10px]">
                      {bill.category}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                      {formatCurrency(bill.amount)}
                    </td>
                  </tr>
                  <tr className="bg-primary/5 font-bold">
                    <td colSpan={2} className="px-4 py-2.5 text-right font-mono uppercase text-[10px] text-text/60">
                      Total Outstanding
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary text-sm">
                      {formatCurrency(bill.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment information if completed */}
          {bill.status === "paid" && (
            <div className="border border-success/20 bg-success/5 p-4 rounded-[3px] space-y-2">
              <h5 className="text-xs font-mono font-bold text-success uppercase flex items-center gap-1.5 select-none">
                <Receipt className="w-4 h-4 stroke-[1.5]" />
                Transaction Payment Receipt
              </h5>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-text/50">Amount Paid:</span>
                  <span className="font-bold text-primary block mt-0.5">{formatCurrency(payment?.amountPaid || bill.amount)}</span>
                </div>
                <div>
                  <span className="text-text/50">Paid On:</span>
                  <span className="font-bold text-primary block mt-0.5">{formatDate(payment?.paymentDate || bill.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-text/50">Payment Method:</span>
                  <span className="font-bold text-primary uppercase block mt-0.5">{payment?.paymentMethod || "online"}</span>
                </div>
                <div>
                  <span className="text-text/50">Transaction ID / Reference:</span>
                  <span className="font-bold text-primary block mt-0.5">{payment?.transactionId || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Overdue alert banner if unpaid and past due */}
          {isOverdue && (
            <div className="border border-danger/20 bg-danger/5 p-3 rounded-[3px] flex items-center gap-2 select-none">
              <Landmark className="w-4 h-4 text-danger shrink-0" />
              <p className="text-[10px] font-mono text-danger">
                ALERT: This invoice is past its due date. Please make payment immediately to avoid late service suspension.
              </p>
            </div>
          )}

        </div>

        {/* Footer print action buttons - Hidden on print */}
        <div className="border-t border-primary/10 p-5 bg-primary/5 rounded-b-md flex justify-between items-center select-none print:hidden">
          {bill.status === "paid" ? (
            <>
              <p className="text-[10px] text-text/50 font-mono italic">
                Printed receipt copies are acceptable proof of payment.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePrint}
                  className="gap-1.5 px-3 py-2 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={onClose}
                  className="px-4 py-2 text-xs"
                >
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] text-text/50 font-mono italic">
                Please settle payment by the invoice due date.
              </p>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={onClose}
                className="px-4 py-2 text-xs ml-auto"
              >
                Close
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
