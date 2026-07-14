import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getComplaints, assignComplaint, updateComplaintStatus, deleteComplaint } from "../../api/complaints";
import { getCommitteeMembers } from "../../api/users";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import { 
  FileWarning, 
  Search, 
  UserSquare2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Calendar,
  User,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminCommitteeComplaints() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Committee list for assigning (Admin only)
  const [committeeMembers, setCommitteeMembers] = useState([]);
  
  // Modal details
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assigningComplaintId, setAssigningComplaintId] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        assignedTo: assigneeFilter || undefined,
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
      setError(err.message || "Failed to load system complaints.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitteeList = async () => {
    try {
      const res = await getCommitteeMembers({ limit: 100 });
      if (res && res.success) {
        setCommitteeMembers(res.users || []);
      }
    } catch (err) {
      console.error("Failed to load committee members for dropdown", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, assigneeFilter]);

  useEffect(() => {
    if (user) {
      fetchCommitteeList();
    }
  }, [user]);

  // Sync modal view details on fetch updates
  useEffect(() => {
    if (selectedComplaint) {
      const updated = complaints.find((c) => c._id === selectedComplaint._id);
      if (updated) {
        setSelectedComplaint(updated);
      }
    }
  }, [complaints]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleAssign = async (complaintId, committeeId) => {
    if (!committeeId) return;
    setAssigningComplaintId(complaintId);
    const toastId = toast.loading("Assigning grievance file...");
    try {
      await assignComplaint(complaintId, { assignedTo: committeeId });
      toast.success("Grievance assigned successfully!", { id: toastId });
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || "Failed to assign grievance.", { id: toastId });
    } finally {
      setAssigningComplaintId(null);
    }
  };

  const handleUpdateComplaint = async (complaintId, payload) => {
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
      
      {/* 1. Title Header */}
      <div className="border-b border-primary/15 pb-4">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider select-none">
          Ledger Management / Action Registry
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Registry Grievances
        </h2>
      </div>

      {/* 2. Search & Filters Panel */}
      <Card className="p-4 bg-surface border border-primary/10 select-none">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Text Search */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-primary/60">Grievance Query Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by title, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background text-text text-sm border border-primary/10 rounded-[4px] px-3 py-2 focus:outline-none focus:border-accent font-sans"
              />
              <Button type="submit" variant="primary" className="p-2.5">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-primary/60">Registry Status</label>
            <Select
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

          {/* Representative Assignee Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-primary/60">Representative Assignee</label>
            <Select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              disabled={committeeMembers.length === 0}
              options={[
                { value: "", label: "All Assignees" },
                ...committeeMembers.map((m) => ({
                  value: m._id,
                  label: m.fullName,
                })),
              ]}
            />
          </div>

        </form>
      </Card>

      {/* 3. Listings */}
      {loading ? (
        <PageLoader message="Consulting registry complaints archive..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Query Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Database returned an online exception: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={fetchComplaints} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Re-run Query
            </Button>
          </Card>
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title="No Matching Entries"
          description="No registered grievances match your active search strings or filters."
        />
      ) : (
        <div className="space-y-4 select-none">
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((c) => (
              <Card 
                key={c._id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 hover:bg-surface/50 border border-primary/10 hover:border-primary/20 transition-all"
              >
                {/* Details Section */}
                <div 
                  onClick={() => setSelectedComplaint(c)}
                  className="flex gap-4 items-center min-w-0 cursor-pointer flex-1 group"
                >
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
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        By: {c.user?.fullName || "Resident"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations & Badge Gating */}
                <div className="flex flex-wrap items-center gap-4 self-end md:self-auto shrink-0 select-none">
                  
                  {/* Inline Assign Action for Admin on Unassigned/Pending Complaints */}
                  {isAdmin && c.status === "open" && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono text-text/50 font-bold uppercase">Assign rep:</span>
                      <div className="w-36">
                        <select
                          value=""
                          onChange={(e) => handleAssign(c._id, e.target.value)}
                          disabled={assigningComplaintId === c._id}
                          className="w-full bg-surface text-text text-xs border border-primary/10 rounded-[4px] px-2 py-1 focus:outline-none font-sans cursor-pointer"
                        >
                          <option value="" disabled>Choose Rep...</option>
                          {committeeMembers.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Assignee Indicator (If already assigned) */}
                  {c.assignedTo && (
                    <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-text/60">
                      <span className="font-semibold text-primary">Assignee:</span>
                      <span>{c.assignedTo.fullName}</span>
                    </div>
                  )}

                  <StampBadge status={c.status} />

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedComplaint(c)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View Details</span>
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

      {/* 4. Detail View Overlay Modal */}
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
