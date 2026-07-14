import React, { useState, useEffect } from "react";
import { getAuditLogs } from "../../api/auditLogs";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";
import { 
  History, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  User, 
  Terminal,
  Globe,
  Inbox
} from "lucide-react";
import Button from "../../components/ui/Button";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchActor, setSearchActor] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      const params = {
        page,
        limit: 20,
        action: actionFilter || undefined,
      };
      const res = await getAuditLogs(params);
      if (res && res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load system audit trail logs.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchLogs();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, actionFilter]);

  // Client-side search for Actor name / email or details
  const filteredLogs = logs.filter(log => {
    if (!searchActor.trim()) return true;
    const term = searchActor.toLowerCase();
    const actorName = log.performedBy?.fullName?.toLowerCase() || "";
    const actorEmail = log.performedBy?.email?.toLowerCase() || "";
    const details = log.details?.toLowerCase() || "";
    return actorName.includes(term) || actorEmail.includes(term) || details.includes(term);
  });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const getActionColor = (action) => {
    if (action.includes("CREATE") || action.includes("GENERATED")) return "bg-success/10 text-success border border-success/20";
    if (action.includes("DELETE") || action.includes("SUSPEND") || action.includes("DELETED")) return "bg-danger/10 text-danger border border-danger/20";
    if (action.includes("UPDATE")) return "bg-accent/10 text-accent border border-accent/20";
    return "bg-primary/10 text-primary border border-primary/20";
  };

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* 1. Header Brand */}
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          System Administration
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          System Audit Trail Logs
        </h2>
      </div>

      {/* 2. Filters & Options Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-primary/5 p-4 rounded-md select-none">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Search Actor / Action details</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by actor name, email, or metadata keywords..."
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
            />
            <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Action Category</label>
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Mutations" },
              { value: "USER_LOGIN", label: "User Login" },
              { value: "USER_LOGOUT", label: "User Logout" },
              { value: "RESIDENT_CREATED", label: "Resident Created" },
              { value: "COMMITTEE_MEMBER_CREATED", label: "Committee Created" },
              { value: "USER_UPDATED", label: "User Updated" },
              { value: "USER_DELETED", label: "User Deleted" },
              { value: "BILL_CREATED", label: "Invoice Created" },
              { value: "BILLS_BULK_GENERATED", label: "Bulk Bill Generation" },
              { value: "PAYMENT_RECORDED", label: "Payment Recorded" },
              { value: "COMPLAINT_CREATED", label: "Complaint Filed" },
              { value: "COMPLAINT_UPDATED", label: "Complaint Updated" },
              { value: "SERVICE_REQUEST_CREATED", label: "Service Request Filed" },
              { value: "SERVICE_REQUEST_UPDATED", label: "Service Request Updated" },
              { value: "ANNOUNCEMENT_CREATED", label: "Notice Published" },
              { value: "ANNOUNCEMENT_DELETED", label: "Notice Deleted" },
            ]}
          />
        </div>
      </div>

      {!loading && !error && (
        <div className="text-xs font-mono text-text/60 select-none">
          <span className="font-bold text-primary">Logged events:</span>
          <span> {totalCount} mutation activities recorded in the system database</span>
        </div>
      )}

      {/* 3. Log Records List */}
      {loading ? (
        <PageLoader message="Querying system audit log history..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Logs Loading Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection failure: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={loadData} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Logs list
            </Button>
          </Card>
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Audit Logs Recorded"
          description="There are no system actions recorded in the database match your criteria."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {filteredLogs.map((log) => (
              <Card 
                key={log._id || log.id}
                className="flex flex-col sm:flex-row items-start justify-between gap-4 py-3.5 border border-primary/10 hover:border-primary/20 bg-surface rounded-[4px] select-text"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 select-none">
                    {/* Action Name Stamp */}
                    <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-[2px] uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] font-mono text-text/40 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text/30" />
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  {/* Details */}
                  <p className="text-sm font-sans font-medium text-primary mt-1.5 break-all">
                    {log.details}
                  </p>

                  {/* Actor details */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-text/50 mt-1 select-none">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-text/30" />
                      Performed by: <strong className="text-primary">{log.performedBy?.fullName || "System/Unknown"}</strong> ({log.performedBy?.email || "N/A"})
                    </span>
                    <span>•</span>
                    <span className="bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.1 rounded-[2px] text-[9px] uppercase">
                      {log.performedBy?.role || "system"}
                    </span>
                  </div>
                </div>

                {/* Optional IP Address trace tag */}
                {log.ipAddress && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-text/40 shrink-0 self-end sm:self-start bg-black/5 border border-primary/10 px-2 py-0.8 rounded-[2px] select-none">
                    <Globe className="w-3.5 h-3.5 text-text/30" />
                    IP: {log.ipAddress}
                  </div>
                )}

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

    </div>
  );
}
