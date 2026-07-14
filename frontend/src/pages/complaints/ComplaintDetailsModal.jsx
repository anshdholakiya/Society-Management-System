import React, { useState } from "react";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { Spinner } from "../../components/ui/Spinner";
import { X, Send, Trash2, Calendar, User, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ComplaintDetailsModal({ complaint, user, onClose, onUpdate, onDelete }) {
  const [newComment, setNewComment] = useState("");
  const [status, setStatus] = useState(complaint.status || "open");
  const [submitting, setSubmitting] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "committee_member";
  const isOwner = user?._id === complaint.user || user?._id === complaint.user?._id;

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!status && !newComment.trim()) return;

    setSubmitting(true);
    const toastId = toast.loading("Recording update in ledger...");
    try {
      await onUpdate(complaint._id, {
        status,
        comment: newComment.trim() ? newComment.trim() : undefined,
      });
      toast.success("Ledger update recorded!", { id: toastId });
      setNewComment("");
    } catch (err) {
      toast.error(err.message || "Failed to submit update.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently withdraw this grievance? This action is irreversible.")) {
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Withdrawing grievance...");
    try {
      await onDelete(complaint._id);
      toast.success("Grievance withdrawn successfully.", { id: toastId });
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to withdraw grievance.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
      <div className="bg-surface border border-primary/20 rounded-md max-w-2xl w-full relative max-h-[90vh] flex flex-col shadow-lg animate-fade-in text-left">
        
        {/* Header Bar */}
        <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
          <div>
            <span className="font-mono text-[10px] tracking-wider uppercase text-text/50">Grievance Dossier</span>
            <h4 className="font-display font-bold text-sm text-primary -mt-0.5">
              Ref: #{complaint._id?.slice(-8).toUpperCase()}
            </h4>
          </div>
          <button 
            onClick={onClose} 
            className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
          
          {/* Main Title & Status */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-display font-extrabold text-2xl text-primary leading-tight">
                {complaint.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text/60 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(complaint.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  By: {complaint.user?.fullName || "Resident Member"}
                </span>
              </div>
            </div>
            <StampBadge status={complaint.status} className="scale-110" />
          </div>

          {/* Description */}
          <Card className="bg-background/25">
            <h5 className="text-xs uppercase font-mono tracking-wider text-primary/70 mb-2">Statement of Grievance</h5>
            <p className="text-sm text-text/90 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </Card>

          {/* Assigned To Meta */}
          {complaint.assignedTo && (
            <div className="flex items-center gap-2 text-xs font-mono text-text/65">
              <span className="font-bold text-primary">Assignee Representative:</span>
              <span>{complaint.assignedTo.fullName} ({complaint.assignedTo.designation || "Committee Member"})</span>
            </div>
          )}

          {/* Attached Photo Evidence */}
          {complaint.imageUrl && (
            <div className="space-y-2">
              <h5 className="text-xs uppercase font-mono tracking-wider text-text/60">Attached Ledger Photo Evidence</h5>
              <div className="border border-primary/10 rounded-[4px] overflow-hidden max-h-72 bg-black/5 flex items-center justify-center">
                <img 
                  src={complaint.imageUrl} 
                  alt="Complaint Evidence" 
                  className="max-h-72 object-contain"
                />
              </div>
            </div>
          )}

          {/* Comments Log */}
          <div className="space-y-3">
            <h5 className="text-xs uppercase font-mono tracking-wider text-primary/70 border-b border-primary/5 pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent stroke-[1.5]" />
              Action Logs & Thread Notes
            </h5>

            {(!complaint.comments || complaint.comments.length === 0) ? (
              <p className="text-xs text-text/50 font-mono italic py-2">No log comments have been appended to this ledger file.</p>
            ) : (
              <div className="space-y-3">
                {complaint.comments.map((c, i) => (
                  <div key={c._id || i} className="border border-primary/5 rounded-[4px] p-3.5 bg-surface/50 space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono select-none">
                      <span className="font-bold text-primary">
                        {c.user?.fullName || "Staff Representative"} 
                        <span className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-1 py-0.2 rounded-[2px] ml-1.5 uppercase">
                          {c.user?.role?.replace("_", " ") || "MEMBER"}
                        </span>
                      </span>
                      <span className="text-text/50 text-[10px]">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text/80 whitespace-pre-wrap font-sans mt-1.5">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Gated Submission Form */}
        <div className="border-t border-primary/10 p-5 bg-primary/5 rounded-b-md select-none">
          {isStaff ? (
            /* Staff Update Form */
            <form onSubmit={handleSubmitUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                  <Select
                    label="Assign Ledger Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: "open", label: "Open" },
                      { value: "assigned", label: "Assigned" },
                      { value: "resolved", label: "Resolved" },
                      { value: "closed", label: "Closed" },
                    ]}
                    disabled={submitting}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary/60">Log Commentary Note</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add statement update comments..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submitting}
                      className="flex-1 bg-surface text-text text-sm border border-primary/10 rounded-[4px] px-3 py-2 focus:outline-none focus:border-accent font-sans"
                    />
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={submitting || (!newComment.trim() && status === complaint.status)}
                      className="flex items-center justify-center p-2.5"
                    >
                      {submitting ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Resident Actions */
            <div className="flex justify-between items-center">
              <p className="text-xs text-text/50 font-mono italic max-w-[70%]">
                Ledger edits locked for resident view. Contact representative for status alterations.
              </p>
              {isOwner && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleDelete} 
                  disabled={submitting}
                  className="gap-1.5 px-3 py-2 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Withdraw Grievance
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
