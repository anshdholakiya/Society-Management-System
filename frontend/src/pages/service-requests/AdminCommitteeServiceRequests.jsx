import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getServiceRequests, updateServiceRequestStatus, deleteServiceRequest } from "../../api/serviceRequests";
import { getCommitteeMembers } from "../../api/users";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import ServiceRequestDetailsModal from "./ServiceRequestDetailsModal";
import { 
  FileWarning, 
  Search, 
  UserSquare2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Calendar,
  User,
  Wrench,
  UserCheck
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminCommitteeServiceRequests() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isCommittee = user?.role === "committee_member";

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Committee list for assigning (Admin dropdown)
  const [committeeMembers, setCommitteeMembers] = useState([]);
  
  // Modal details
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
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
      setError(err.message || "Failed to load system service requests.");
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
    fetchRequests();
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    if (user) {
      fetchCommitteeList();
    }
  }, [user]);

  // Sync modal view details on fetch updates
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find((r) => r._id === selectedRequest._id);
      if (updated) {
        setSelectedRequest(updated);
      }
    }
  }, [requests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleAssign = async (requestId, memberId) => {
    if (!memberId) return;
    setUpdatingRequestId(requestId);
    const toastId = toast.loading("Assigning representative...");
    try {
      await updateServiceRequestStatus(requestId, {
        assignedTo: memberId,
        status: "assigned",
      });
      toast.success("Representative assigned successfully!", { id: toastId });
      fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to assign representative.", { id: toastId });
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleSelfAssign = async (requestId) => {
    setUpdatingRequestId(requestId);
    const toastId = toast.loading("Self-assigning request...");
    try {
      await updateServiceRequestStatus(requestId, {
        assignedTo: user._id,
        status: "assigned",
      });
      toast.success("Request assigned to you successfully!", { id: toastId });
      fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to self-assign request.", { id: toastId });
    } finally {
      setUpdatingRequestId(null);
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
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          Management Desk
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Service Request Ledger Registry
        </h2>
      </div>

      {/* 2. Operations Bar (Search & Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-primary/5 p-4 rounded-md select-none">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Search Requests</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
              />
              <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </form>

        {/* Category Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Filter Category</label>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              { value: "Plumbing", label: "Plumbing" },
              { value: "Electrical", label: "Electrical" },
              { value: "Housekeeping", label: "Housekeeping" },
              { value: "Pest Control", label: "Pest Control" },
              { value: "Other", label: "Other" },
            ]}
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Filter Status</label>
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
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </div>

      </div>

      {/* 3. Stats Summary */}
      {!loading && !error && (
        <div className="text-xs font-mono text-text/65 select-none">
          <span className="font-bold text-primary">Active Cases:</span>
          <span> {totalCount} matching service records found in ledger</span>
        </div>
      )}

      {/* 4. Request List */}
      {loading ? (
        <PageLoader message="Querying system database registries..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Registry Query Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Database connection failed: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={fetchRequests} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Retry Query
            </Button>
          </Card>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Requests Match Filter"
          description="There are no system service requests matching the specified search parameters or status filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {requests.map((r) => (
              <Card 
                key={r._id} 
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border border-primary/10 transition-all hover:border-primary/20"
              >
                
                {/* Details Section */}
                <div 
                  onClick={() => setSelectedRequest(r)}
                  className="flex gap-4 items-center min-w-0 cursor-pointer flex-1 group"
                >
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
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <User className="w-3.5 h-3.5" />
                        By: {r.raisedBy?.fullName || "Resident Member"} {r.raisedBy?.unitNumber && `(${r.raisedBy.block}-${r.raisedBy.unitNumber})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations & Badge Gating */}
                <div className="flex flex-wrap items-center gap-4 self-end md:self-auto shrink-0 select-none">
                  
                  {/* Inline Assign Action for Admin on Unassigned Requests */}
                  {isAdmin && r.status === "open" && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono text-text/50 font-bold uppercase">Assign rep:</span>
                      <div className="w-36">
                        <select
                          value=""
                          onChange={(e) => handleAssign(r._id, e.target.value)}
                          disabled={updatingRequestId === r._id}
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

                  {/* Self-Assign Action for Committee Member on Unassigned Requests */}
                  {isCommittee && r.status === "open" && !r.assignedTo && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelfAssign(r._id)}
                      disabled={updatingRequestId === r._id}
                      className="flex items-center gap-1 text-[10px] py-1 px-2.5 font-mono select-none"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Self Assign
                    </Button>
                  )}

                  {/* Assignee Indicator (If already assigned) */}
                  {r.assignedTo && (
                    <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-text/60">
                      <span className="font-semibold text-primary">Assignee:</span>
                      <span>{r.assignedTo.fullName}</span>
                    </div>
                  )}

                  <StampBadge status={r.status} />

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedRequest(r)}
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
