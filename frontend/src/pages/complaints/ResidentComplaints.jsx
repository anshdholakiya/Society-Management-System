import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { getComplaints, createComplaint, deleteComplaint, updateComplaintStatus } from "../../api/complaints";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { PageLoader } from "../../components/ui/Spinner";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import { 
  Plus, 
  FileWarning, 
  Camera, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  X,
  Calendar,
  User,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ResidentComplaints() {
  const { user } = useAuth();
  
  // States
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // File Upload States
  const [imageFile, setImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
      };
      const res = await getComplaints(params);
      if (res && res.success) {
        setComplaints(res.complaints || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setError(err.message || "Failed to load grievance ledger entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter]);

  // Sync selected complaint if the list is updated
  useEffect(() => {
    if (selectedComplaint) {
      const updated = complaints.find((c) => c._id === selectedComplaint._id);
      if (updated) {
        setSelectedComplaint(updated);
      }
    }
  }, [complaints]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size must not exceed 5MB");
        return;
      }
      setImageFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setImageFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading("Filing grievance with registry...");
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await createComplaint(formData);
      toast.success("Complaint filed successfully!", { id: toastId });
      
      // Cleanup & Close
      setIsFormOpen(false);
      reset();
      handleClearFile();
      setPage(1);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || "Failed to file complaint.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComplaint = async (complaintId, payload) => {
    // Resident action: updates status/comment (mostly triggered from modal by staff, but residents can view comments)
    await updateComplaintStatus(complaintId, payload);
    await fetchComplaints();
  };

  const handleDeleteComplaint = async (complaintId) => {
    await deleteComplaint(complaintId);
    await fetchComplaints();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* 1. Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4">
        <div>
          <span className="text-xs font-mono text-text/50 uppercase tracking-wider select-none">
            Resident Corner
          </span>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
            Maintenance Grievances
          </h2>
        </div>
        <Button variant="primary" onClick={() => setIsFormOpen(true)} className="gap-2 select-none">
          <Plus className="w-4 h-4" />
          File New Grievance
        </Button>
      </div>

      {/* 2. Filters & Status Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-text/65">
          <span className="font-bold text-primary">Active Grievances:</span>
          <span>{totalCount} cases filed</span>
        </div>

        <div className="w-full sm:w-48">
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "open", label: "Open" },
              { value: "assigned", label: "Assigned" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </div>
      </div>

      {/* 3. Listings */}
      {loading ? (
        <PageLoader message="Retrieving complaint registry logs..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection to database was interrupted: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={fetchComplaints} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Grievance Index
            </Button>
          </Card>
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title={statusFilter ? "No Status Match" : "No Grievances Recorded"}
          description={statusFilter ? "No cases match the selected status filter in your logs." : "You have not registered any maintenance complaints under your flat unit yet."}
        />
      ) : (
        <div className="space-y-4 select-none">
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((c) => (
              <Card 
                key={c._id} 
                onClick={() => setSelectedComplaint(c)}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="flex gap-4 items-center min-w-0">
                  {/* Thumbnail display */}
                  <div className="w-12 h-12 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0 select-none">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <FileWarning className="w-5 h-5 text-text/30" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-primary group-hover:text-accent transition-colors truncate">
                      {c.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(c.createdAt)}
                      </span>
                      {c.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          Assignee: {c.assignedTo.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 select-none">
                  <StampBadge status={c.status} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComplaint(c);
                    }}
                    className="hidden sm:flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Raise Complaint Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-lg w-full relative p-8 shadow-lg animate-fade-in text-left">
            <button 
              onClick={() => {
                setIsFormOpen(false);
                reset();
                handleClearFile();
              }}
              className="absolute top-4 right-4 text-text/70 hover:text-primary p-1 rounded-sm cursor-pointer"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-primary/15 pb-4 mb-6 text-center select-none">
              <h2 className="text-3xl font-display font-bold text-primary">File Grievance</h2>
              <p className="font-sans text-xs text-text/60 mt-1 uppercase tracking-wider font-semibold">
                Submit Flat Maintenance Registry Card
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Complaint Statement Title"
                placeholder="e.g., Block D Elevator Failure"
                error={errors.title}
                disabled={submitting}
                required
                {...register("title", {
                  required: "Complaint summary title is required",
                  minLength: { value: 5, message: "Summary title must be at least 5 characters" },
                })}
              />

              <Textarea
                label="Grievance Details Description"
                placeholder="Provide a detailed ledger explanation regarding the maintenance defect..."
                error={errors.description}
                disabled={submitting}
                required
                rows={4}
                {...register("description", {
                  required: "Detailed grievance explanation is required",
                  minLength: { value: 15, message: "Description must be at least 15 characters" },
                })}
              />

              {/* Photo Evidence Drag/Drop zone */}
              <div className="space-y-1.5 select-none">
                <label className="text-xs font-semibold text-primary/60 block">
                  Photo Evidence Attachment (Optional)
                </label>
                
                {filePreview ? (
                  <div className="border border-primary/10 rounded-[4px] p-3 bg-primary/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 border border-primary/15 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={filePreview} alt="Upload Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-mono text-text/80 truncate">{imageFile?.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleClearFile} 
                      className="text-text/75 hover:text-danger p-1 rounded-sm cursor-pointer shrink-0"
                      disabled={submitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-primary/15 rounded-[4px] py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all select-none">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    <Camera className="w-8 h-8 text-text/40 stroke-[1.5]" />
                    <span className="text-xs font-semibold text-primary/70">Attach Photo Evidence</span>
                    <span className="text-[10px] text-text/50 font-mono">Max size 5MB (PNG/JPG)</span>
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsFormOpen(false);
                    reset();
                    handleClearFile();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting} 
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="border-surface" />
                      <span>Filing Registry...</span>
                    </>
                  ) : (
                    <span>Submit Statement</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Detail View Overlay Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          user={user}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={handleUpdateComplaint}
          onDelete={handleDeleteComplaint}
        />
      )}

    </div>
  );
}
