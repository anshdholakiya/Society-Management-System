import React, { useState, useEffect } from "react";
import { getResidents, updateUser, deleteUser } from "../../api/users";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import UserFormModal from "./UserFormModal";
import {
  Users,
  Search,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  ShieldAlert,
  X,
  CheckCircle,
  HelpCircle,
  Inbox
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "true" | "false"
  const [allBlocks, setAllBlocks] = useState([]); // Static independent blocks list

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fetchAllBlocks = async () => {
    try {
      const res = await getResidents({ limit: 1000 });
      if (res && res.success) {
        const blocks = Array.from(new Set(res.users?.map(r => r.block).filter(Boolean))).sort();
        setAllBlocks(blocks);
      }
    } catch (err) {
      console.error("Failed to fetch initial blocks list", err);
    }
  };

  useEffect(() => {
    fetchAllBlocks();
  }, []);

  const fetchResidentsList = async () => {
    try {
      const params = {
        page,
        limit: 10,
        block: blockFilter || undefined,
        isActive: statusFilter || undefined,
      };
      const res = await getResidents(params);
      if (res && res.success) {
        setResidents(res.users || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load resident registry.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchResidentsList();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, blockFilter, statusFilter]);

  // Local search filter
  const filteredResidents = residents.filter(r => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      r.fullName?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.phone?.toLowerCase().includes(term) ||
      r.unitNumber?.toLowerCase().includes(term)
    );
  });

  const handleToggleStatus = async (userRecord) => {
    const nextStatus = !userRecord.isActive;
    const label = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${label} access for ${userRecord.fullName}?`)) {
      return;
    }

    const toastId = toast.loading(`${nextStatus ? "Activating" : "Suspending"} user account...`);
    try {
      await updateUser(userRecord._id || userRecord.id, { isActive: nextStatus });
      toast.success(`Account ${nextStatus ? "activated" : "suspended"} successfully!`, { id: toastId });
      fetchResidentsList();
    } catch (err) {
      toast.error(err.message || "Failed to toggle status.", { id: toastId });
    }
  };

  const handleDeleteClick = async (userRecord) => {
    if (!window.confirm(`Are you sure you want to permanently delete the resident account for ${userRecord.fullName}? This is irreversible.`)) {
      return;
    }
    const toastId = toast.loading("Checking database dependencies and deleting user...");
    try {
      await deleteUser(userRecord._id || userRecord.id);
      toast.success("Account deleted successfully.", { id: toastId });
      setPage(1);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete account.", { id: toastId });
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSubmittingPassword(true);
    const toastId = toast.loading("Updating login credentials...");
    try {
      await updateUser(resettingPasswordUser._id || resettingPasswordUser.id, { password: newPassword });
      toast.success("Password reset successfully!", { id: toastId });
      setResettingPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to reset password.", { id: toastId });
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Extract static block list for dropdown mapping
  const blockOptions = allBlocks.map(b => ({ value: b, label: `Block ${b}` }));

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">

      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4 select-none">
        <div>
          <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
            Management Desk
          </span>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
            Residents Registry
          </h2>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setIsFormOpen(true);
          }}
          className="gap-2 text-xs py-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Resident
        </Button>
      </div>

      {/* 2. Search & Filter Desk */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-primary/5 p-4 rounded-md select-none">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Search Resident Name / Unit</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, phone, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
            />
            <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Block / Wing</label>
          <Select
            value={blockFilter}
            placeholder="All Blocks"
            onChange={(e) => {
              setBlockFilter(e.target.value);
              setPage(1);
            }}
            options={blockOptions}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-primary/60">Access Status</label>
          <Select
            value={statusFilter}
            placeholder="All Accounts"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "true", label: "Active Access" },
              { value: "false", label: "Suspended" },
            ]}
          />
        </div>
      </div>

      {!loading && !error && (
        <div className="text-xs font-mono text-text/60 select-none">
          <span className="font-bold text-primary">Registered:</span>
          <span> {totalCount} resident accounts logged in the database</span>
        </div>
      )}

      {/* 3. Residents List */}
      {loading ? (
        <PageLoader message="Fetching residents database..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Ledger Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection failure: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={loadData} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Registry desk
            </Button>
          </Card>
        </div>
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Residents Found"
          description="Click Add Resident above to register a new unit resident account."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredResidents.map((r) => (
              <Card
                key={r._id || r.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border border-primary/10 hover:border-primary/20 hover:bg-surface/50 transition-all rounded-[4px]"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-11 h-11 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center shrink-0 select-none">
                    <Users className="w-5 h-5 text-text/30" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 select-none">
                      <StampBadge status={r.isActive ? "active" : "deactivated"} />
                      <span className="text-[10px] font-mono text-text/40">Unit: {r.block}-{r.unitNumber}</span>
                      <span className="bg-primary/5 text-primary font-mono text-[9px] border border-primary/10 px-1.5 py-0.2 rounded-[2px] uppercase">
                        {r.ownershipStatus}
                      </span>
                    </div>

                    <h3 className="font-display font-extrabold text-primary leading-tight mt-1 truncate">
                      {r.fullName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                      <span className="break-all">Email: {r.email}</span>
                      {r.phone && (
                        <>
                          <span>•</span>
                          <span>Phone: {r.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations controls */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0 select-none">

                  {/* Status Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(r)}
                    className={`text-xs font-mono border px-3 py-1.5 ${r.isActive
                        ? "text-warning border-warning/20 bg-warning/5 hover:bg-warning/10"
                        : "text-success border-success/20 bg-success/5 hover:bg-success/10"
                      }`}
                  >
                    {r.isActive ? "Suspend" : "Activate"}
                  </Button>

                  {/* Password Reset */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResettingPasswordUser(r)}
                    className="p-2 text-text/40 hover:text-accent border border-primary/10 bg-black/5"
                  >
                    <Lock className="w-4 h-4" />
                  </Button>

                  {/* Edit Profile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingUser(r);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-text/40 hover:text-primary border border-primary/10 bg-black/5"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {/* Delete Soft delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(r)}
                    className="p-2 text-text/40 hover:text-danger border border-primary/10 bg-black/5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
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

      {/* 4. Shared User Form Modal */}
      {isFormOpen && (
        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          role="resident"
          onSubmitSuccess={loadData}
        />
      )}

      {/* 5. Password Reset Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/20 rounded-md max-w-sm w-full relative flex flex-col shadow-lg animate-fade-in text-left">

            <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
              <div>
                <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Credential updates</span>
                <h4 className="font-display font-bold text-sm text-primary -mt-0.5">Reset Login Password</h4>
              </div>
              <button
                onClick={() => { setResettingPasswordUser(null); setNewPassword(""); }}
                className="text-text/75 hover:text-primary p-1 rounded-sm cursor-pointer"
                disabled={submittingPassword}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4 font-sans">

              <div className="p-3 border border-primary/10 rounded-[3px] bg-primary/5 text-xs font-mono select-none space-y-1">
                <div><span className="text-text/50">Resident Name:</span> <span className="font-bold text-primary">{resettingPasswordUser.fullName}</span></div>
                <div><span className="text-text/50">Email:</span> <span className="font-bold text-primary">{resettingPasswordUser.email}</span></div>
              </div>

              <Input
                label="New Password"
                type="text"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submittingPassword}
                required
              />

              <div className="border-t border-primary/10 pt-4 mt-6 flex justify-end gap-3 select-none">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setResettingPasswordUser(null); setNewPassword(""); }}
                  disabled={submittingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingPassword}
                  className="gap-2 min-w-32"
                >
                  {submittingPassword ? <Spinner size="sm" /> : "Save New Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
