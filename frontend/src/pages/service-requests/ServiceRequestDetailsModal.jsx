import React, { useState } from "react";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import { Spinner } from "../../components/ui/Spinner";
import { X, Send, Trash2, Calendar, User, MessageSquare, AlertCircle, Wrench, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ServiceRequestDetailsModal({ request, user, onClose, onUpdate, onDelete }) {
  const [newComment, setNewComment] = useState("");
  const [status, setStatus] = useState(request.status || "open");
  const [submitting, setSubmitting] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "committee_member";
  const isOwner = user?._id === request.raisedBy || user?._id === request.raisedBy?._id;

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!status && !newComment.trim()) return;

    setSubmitting(true);
    const toastId = toast.loading("Updating service request ledger...");
    try {
      await onUpdate(request._id, {
        status,
        comment: newComment.trim() ? newComment.trim() : undefined,
      });
      toast.success("Service request updated successfully!", { id: toastId });
      setNewComment("");
    } catch (err) {
      toast.error(err.message || "Failed to submit update.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to retract this service request? This action cannot be undone.")) {
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Retracting service request...");
    try {
      await onDelete(request._id);
      toast.success("Service request retracted successfully.", { id: toastId });
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to retract service request.", { id: toastId });
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
            <span className="font-mono text-[10px] tracking-wider uppercase text-text/50">Service Request Ledger</span>
            <h4 className="font-display font-bold text-sm text-primary -mt-0.5">
              Ref: #{request._id?.slice(-8).toUpperCase()}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider bg-primary/5 border border-primary/10 text-primary px-1.5 py-0.5 rounded-[2px]">
                  {request.category}
                </span>
                <span className="text-xs text-text/50 font-mono">Priority:</span>
                <StampBadge status={request.priority} className="text-[10px] py-0 px-1.5" />
              </div>
              <h3 className="font-display font-extrabold text-2xl text-primary leading-tight">
                {request.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text/60 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(request.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  By: {request.raisedBy?.fullName || "Resident Member"} 
                  {request.raisedBy?.unitNumber && ` (${request.raisedBy.block}-${request.raisedBy.unitNumber})`}
                </span>
              </div>
            </div>
            <StampBadge status={request.status} className="scale-110" />
          </div>

          {/* Description */}
          <Card className="bg-background/25">
            <h5 className="text-xs uppercase font-mono tracking-wider text-primary/70 mb-2">Description of Work</h5>
            <p className="text-sm text-text/90 leading-relaxed whitespace-pre-wrap">{request.description}</p>
          </Card>

          {/* Assigned To Meta */}
          {request.assignedTo && (
            <div className="flex items-center gap-2 text-xs font-mono text-text/65">
              <span className="font-bold text-primary">Assigned Representative:</span>
              <span>{request.assignedTo.fullName} ({request.assignedTo.designation || "Committee Member"})</span>
            </div>
          )}

          {/* Attached Photo Evidence */}
          {request.imageUrl && (
            <div className="space-y-2">
              <h5 className="text-xs uppercase font-mono tracking-wider text-text/60">Attached Photo (Click to zoom)</h5>
              <div 
                onClick={() => setIsEnlarged(true)}
                className="border border-primary/10 rounded-[4px] overflow-hidden max-h-72 bg-black/5 flex items-center justify-center cursor-zoom-in group relative"
              >
                <img 
                  src={request.imageUrl} 
                  alt="Service Request Reference" 
                  className="max-h-72 object-contain group-hover:opacity-95 transition-opacity"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to enlarge
                </div>
              </div>
            </div>
          )}

          {/* Comments Log */}
          <div className="space-y-3">
            <h5 className="text-xs uppercase font-mono tracking-wider text-primary/70 border-b border-primary/5 pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent stroke-[1.5]" />
              Work Progress & Action Logs
            </h5>

            {(!request.comments || request.comments.length === 0) ? (
              <p className="text-xs text-text/50 font-mono italic py-2">No progress logs have been appended to this service request yet.</p>
            ) : (
              <div className="space-y-3">
                {request.comments.map((c, i) => (
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
                    label="Update Progress Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: "open", label: "Open" },
                      { value: "assigned", label: "Assigned" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "resolved", label: "Resolved" },
                      { value: "closed", label: "Closed" },
                    ]}
                    disabled={submitting}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary/60">Log Commentary / Progress Note</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add status updates or comments..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submitting}
                      className="flex-1 bg-surface text-text text-sm border border-primary/10 rounded-[4px] px-3 py-2 focus:outline-none focus:border-accent font-sans"
                    />
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={submitting || (!newComment.trim() && status === request.status)}
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
              {isOwner && ["open", "assigned"].includes(request.status) && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleDelete} 
                  disabled={submitting}
                  className="gap-1.5 px-3 py-2 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Request
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Enlarged Image Modal Overlay */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsEnlarged(false)}
        >
          <button 
            onClick={() => setIsEnlarged(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 focus:outline-none"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={request.imageUrl} 
            alt="Service Request Reference Enlarged" 
            className="max-w-full max-h-full object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
