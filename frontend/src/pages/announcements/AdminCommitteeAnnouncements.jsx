import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from "../../api/announcements";
import { getResidents } from "../../api/users";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import AnnouncementDetailsModal from "./AnnouncementDetailsModal";
import { 
  Plus, 
  Megaphone, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Edit, 
  Calendar, 
  User, 
  Image as ImageIcon,
  X, 
  MapPin 
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminCommitteeAnnouncements() {
  const { user } = useAuth();

  // Data logs
  const [announcements, setAnnouncements] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal forms states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      content: "",
      targetAudience: "all",
      targetBlock: "",
      priority: "normal",
      expiresAt: "",
    }
  });

  const fetchAnnouncements = async () => {
    try {
      const params = { page, limit: 10 };
      const res = await getAnnouncements(params);
      if (res && res.success) {
        setAnnouncements(res.announcements || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load management feed.");
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await getResidents({ limit: 100 });
      if (res && res.success) {
        setResidents(res.users || []);
      }
    } catch (err) {
      console.error("Failed to load block dropdown references:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchAnnouncements(), fetchResidents()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page]);

  // Extract unique blocks dynamically from the residents list to prevent typos
  const uniqueBlocks = Array.from(
    new Set(
      residents
        .map(r => r.block)
        .filter(Boolean)
    )
  ).sort();

  // Local Search filtering
  const filteredAnnouncements = announcements.filter(a => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      a.title?.toLowerCase().includes(term) ||
      a.content?.toLowerCase().includes(term) ||
      a.publishedBy?.fullName?.toLowerCase().includes(term)
    );
  });

  // Handle Image upload preview selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed!");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading("Uploading image and dispatching announcement...");
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("content", data.content.trim());
      formData.append("targetAudience", data.targetAudience);
      formData.append("targetBlock", data.targetBlock || "");
      formData.append("priority", data.priority);
      if (data.expiresAt) {
        formData.append("expiresAt", data.expiresAt);
      }
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await createAnnouncement(formData);
      toast.success("Announcement published successfully!", { id: toastId });
      setIsCreateOpen(false);
      reset();
      setImagePreview("");
      setSelectedFile(null);
      setPage(1);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to publish notice.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this announcement? This action is irreversible.")) {
      return;
    }
    const toastId = toast.loading("Removing notice from system...");
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted successfully.", { id: toastId });
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete notice.", { id: toastId });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* 1. Header Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4 select-none">
        <div>
          <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
            Management Desk
          </span>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
            Announcement Board
          </h2>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs py-2">
          <Plus className="w-4 h-4" />
          Create Notice
        </Button>
      </div>

      {/* 2. Filter Search bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-primary/5 p-4 rounded-md select-none">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by title, body content, or publisher..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
          />
          <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
        </div>
        <div className="text-xs font-mono text-text/60">
          <span>Active board: {totalCount} announcements logged</span>
        </div>
      </div>

      {/* 3. List Panel */}
      {loading ? (
        <PageLoader message="Fetching system notice registry..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Notice Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection failure: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={loadData} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Board Registry
            </Button>
          </Card>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Notices Registered"
          description="Click Create Notice above to dispatch a new bulletin announcement."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredAnnouncements.map((a) => {
              const isUrgent = a.priority === "urgent";
              const isImportant = a.priority === "important";
              const canManage = user.role === "admin" || a.publishedBy?._id === user.id;

              const cardClass = isUrgent
                ? "border-danger/30 bg-danger/5 hover:border-danger/45"
                : isImportant 
                  ? "border-warning/30 bg-warning/5 hover:border-warning/45"
                  : "border-primary/10 hover:border-primary/20 hover:bg-surface/50";

              return (
                <Card 
                  key={a._id}
                  onClick={() => setSelectedAnnouncement(a)}
                  className={`flex flex-col sm:flex-row items-start justify-between gap-4 py-4 transition-all cursor-pointer group rounded-[4px] border ${cardClass}`}
                >
                  <div className="flex gap-4 items-start min-w-0">
                    <div className={`w-10 h-10 border rounded-[3px] flex items-center justify-center overflow-hidden shrink-0 select-none ${
                      isUrgent 
                        ? "bg-danger/10 border-danger/20 text-danger" 
                        : isImportant 
                          ? "bg-warning/10 border-warning/20 text-warning" 
                          : "bg-black/5 border-primary/10 text-text/30"
                    }`}>
                      <Megaphone className="w-4.5 h-4.5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 select-none">
                        <StampBadge 
                          status={a.expiresAt && new Date(a.expiresAt) <= new Date() ? "Expired" : "Active"} 
                          className="scale-90"
                        />
                        <span className={`text-[10px] font-mono font-bold uppercase ${
                          a.priority === "urgent" ? "text-danger" : (a.priority === "important" ? "text-warning" : "text-text/40")
                        }`}>
                          {a.priority}
                        </span>
                        <span className="text-[10px] font-mono text-text/40">Posted: {formatDate(a.createdAt)}</span>
                        {a.targetBlock && (
                          <span className="bg-accent/10 text-accent font-mono text-[9px] border border-accent/20 px-1.5 py-0.2 rounded-[2px]">
                            Block {a.targetBlock}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-text/40">Target: {a.targetAudience}</span>
                      </div>

                      <h3 className="font-display font-extrabold text-primary group-hover:text-accent transition-colors leading-tight truncate">
                        {a.title}
                      </h3>

                      <p className="text-xs text-text/60 leading-normal line-clamp-2 pr-6">
                        {a.content}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-text/40 pt-1 select-none">
                        <User className="w-3.5 h-3.5" />
                        <span>By: {a.publishedBy?.fullName} ({a.publishedBy?.designation || "Admin"})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDelete(a._id, e)}
                        className="p-1.5 text-text/40 hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedAnnouncement(a)}
                      className="gap-1 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Notice
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

      {/* 4. Create Notice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-md w-full relative flex flex-col shadow-lg animate-fade-in text-left">
            
            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Board Desk</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Publish New Announcement</h4>
              </div>
              <button 
                onClick={() => { setIsCreateOpen(false); reset(); setImagePreview(""); setSelectedFile(null); }}
                className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] font-sans">
              
              <Input
                label="Announcement Title"
                placeholder="e.g. Water Supply Maintenance Shutdown"
                error={errors.title?.message}
                disabled={submitting}
                {...register("title", { required: "Title is required" })}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary/60">Notice Content Body</label>
                <textarea
                  placeholder="Provide all essential details regarding this announcement notices..."
                  rows={4}
                  disabled={submitting}
                  className={`w-full bg-surface text-text text-sm border rounded-[4px] px-3 py-2 focus:outline-none focus:border-accent font-sans ${
                    errors.content ? "border-danger" : "border-primary/10"
                  }`}
                  {...register("content", { required: "Content body is required" })}
                />
                {errors.content && <span className="text-xs text-danger mt-1">{errors.content.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Target Audience"
                  disabled={submitting}
                  {...register("targetAudience")}
                  options={[
                    { value: "all", label: "All Users" },
                    { value: "residents", label: "Residents Only" },
                    { value: "committee", label: "Committee Only" },
                  ]}
                />
                
                <Select
                  label="Target Block (Scope)"
                  disabled={submitting}
                  {...register("targetBlock")}
                  options={[
                    { value: "", label: "All Blocks" },
                    ...uniqueBlocks.map(b => ({ value: b, label: `Block ${b}` }))
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priority Level"
                  disabled={submitting}
                  {...register("priority")}
                  options={[
                    { value: "normal", label: "Normal / General" },
                    { value: "important", label: "Important" },
                    { value: "urgent", label: "Urgent Alert" },
                  ]}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  error={errors.expiresAt?.message}
                  disabled={submitting}
                  {...register("expiresAt", {
                    validate: val => {
                      if (!val) return true;
                      return new Date(val) > new Date() || "Expiry date must be in the future";
                    }
                  })}
                />
              </div>

              {/* File Attachment Upload */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary/60">Attach Image notice (Optional)</label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="border border-dashed border-primary/20 rounded-[4px] px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-primary/5 select-none text-xs font-semibold text-primary/70">
                    <ImageIcon className="w-4 h-4 text-text/40" />
                    <span>Upload Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      disabled={submitting}
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-16 h-16 border border-primary/10 rounded-[3px] overflow-hidden bg-black/5 flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setImagePreview(""); setSelectedFile(null); }}
                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 cursor-pointer hover:bg-black/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setIsCreateOpen(false); reset(); setImagePreview(""); setSelectedFile(null); }}
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
                  {submitting ? <Spinner size="sm" /> : "Publish Notice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Read Details Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}

    </div>
  );
}
