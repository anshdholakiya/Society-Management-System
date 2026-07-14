import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { getServiceRequests, createServiceRequest, deleteServiceRequest, updateServiceRequestStatus } from "../../api/serviceRequests";
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
import ServiceRequestDetailsModal from "./ServiceRequestDetailsModal";
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
  Wrench,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ResidentServiceRequests() {
  const { user } = useAuth();
  
  // States
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
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
      category: "",
      priority: "medium",
    },
  });

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
      };
      const res = await getServiceRequests(params);
      if (res && res.success) {
        setRequests(res.requests || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setError(err.message || "Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  // Sync selected request if the list is updated
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find((r) => r._id === selectedRequest._id);
      if (updated) {
        setSelectedRequest(updated);
      }
    }
  }, [requests]);

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
    const toastId = toast.loading("Filing service request...");
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("category", data.category);
      formData.append("priority", data.priority);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await createServiceRequest(formData);
      toast.success("Service request submitted successfully!", { id: toastId });
      
      // Cleanup & Close
      setIsFormOpen(false);
      reset();
      handleClearFile();
      setPage(1);
      fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to submit service request.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequest = async (requestId, payload) => {
    await updateServiceRequestStatus(requestId, payload);
    await fetchRequests();
  };

  const handleDeleteRequest = async (requestId) => {
    await deleteServiceRequest(requestId);
    await fetchRequests();
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
            Maintenance Service Requests
          </h2>
        </div>
        <Button variant="primary" onClick={() => setIsFormOpen(true)} className="gap-2 select-none">
          <Plus className="w-4 h-4" />
          Raise New Request
        </Button>
      </div>

      {/* 2. Filters & Status Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-text/65">
          <span className="font-bold text-primary">Active Requests:</span>
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
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </div>
      </div>

      {/* 3. Listings */}
      {loading ? (
        <PageLoader message="Retrieving service request registry logs..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection to database was interrupted: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={fetchRequests} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Service Index
            </Button>
          </Card>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={statusFilter ? "No Status Match" : "No Service Requests Recorded"}
          description={statusFilter ? "No cases match the selected status filter in your logs." : "You have not registered any maintenance service requests under your flat unit yet."}
        />
      ) : (
        <div className="space-y-4 select-none">
          <div className="grid grid-cols-1 gap-4">
            {requests.map((r) => (
              <Card 
                key={r._id} 
                onClick={() => setSelectedRequest(r)}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="flex gap-4 items-center min-w-0">
                  {/* Thumbnail display */}
                  <div className="w-12 h-12 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center overflow-hidden shrink-0 select-none">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Wrench className="w-5 h-5 text-text/30" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono tracking-wider uppercase bg-primary/5 text-primary border border-primary/10 px-1 py-0.2 rounded-[2px]">
                        {r.category}
                      </span>
                      <StampBadge status={r.priority} className="text-[9px] py-0 px-1.5" />
                    </div>
                    <h3 className="font-display font-bold text-primary group-hover:text-accent transition-colors truncate mt-1">
                      {r.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(r.createdAt)}
                      </span>
                      {r.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          Assignee: {r.assignedTo.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 select-none">
                  <StampBadge status={r.status} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(r);
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

      {/* 4. Raise Service Request Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-lg w-full relative max-h-[95vh] flex flex-col shadow-lg animate-fade-in text-left">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Lodger Dispatch</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Submit Maintenance Service Request</h4>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  reset();
                  handleClearFile();
                }}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category of Service"
                  error={errors.category?.message}
                  disabled={submitting}
                  {...register("category", { required: "Please select service category" })}
                  options={[
                    { value: "", label: "Choose Category..." },
                    { value: "Plumbing", label: "Plumbing" },
                    { value: "Electrical", label: "Electrical" },
                    { value: "Housekeeping", label: "Housekeeping" },
                    { value: "Pest Control", label: "Pest Control" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <Select
                  label="Work Priority"
                  error={errors.priority?.message}
                  disabled={submitting}
                  {...register("priority", { required: "Please select priority level" })}
                  options={[
                    { value: "low", label: "Low (Routine)" },
                    { value: "medium", label: "Medium (Standard)" },
                    { value: "high", label: "High (Urgent)" },
                  ]}
                />
              </div>

              <Input
                label="Request Title"
                placeholder="e.g. Broken water pipe in master bathroom"
                error={errors.title?.message}
                disabled={submitting}
                {...register("title", { required: "Request title is required" })}
              />

              <Textarea
                label="Description of Issue / Work Requested"
                placeholder="Please describe exactly what needs fixing, where it is located, and any specific times you are available..."
                rows={4}
                error={errors.description?.message}
                disabled={submitting}
                {...register("description", { required: "Request description is required" })}
              />

              {/* Image Upload Zone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary/60 select-none">Optional Reference Photo</label>
                
                {filePreview ? (
                  <div className="relative border border-primary/10 rounded-[4px] p-2 bg-background/20 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover border border-primary/10 rounded-[2px]" />
                      <div className="text-xs truncate font-mono text-text/70">{imageFile?.name}</div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearFile} 
                      disabled={submitting}
                      className="p-1 text-text/50 hover:text-danger cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-primary/15 hover:border-accent/40 rounded-[4px] py-6 px-4 bg-background/5 flex flex-col items-center justify-center cursor-pointer transition-all group select-none">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      disabled={submitting}
                    />
                    <Camera className="w-6 h-6 text-text/30 group-hover:text-accent/60 transition-colors stroke-[1.5]" />
                    <span className="text-xs font-semibold text-text/60 mt-1">Upload Reference Image</span>
                    <span className="text-[10px] text-text/40 font-mono mt-0.5">JPEG, PNG up to 5MB</span>
                  </label>
                )}
              </div>

              {/* Submit Controls */}
              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
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
                  className="gap-2 min-w-32"
                >
                  {submitting ? <Spinner size="sm" /> : "Submit Request"}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. Request Details Modal */}
      {selectedRequest && (
        <ServiceRequestDetailsModal
          request={selectedRequest}
          user={user}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdateRequest}
          onDelete={handleDeleteRequest}
        />
      )}

    </div>
  );
}
