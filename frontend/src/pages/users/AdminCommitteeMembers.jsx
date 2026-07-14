import React, { useState, useEffect } from "react";
import { getCommitteeMembers, updateUser, deleteUser } from "../../api/users";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import UserFormModal from "./UserFormModal";
import {
  UserSquare2,
  Search,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  X,
  Inbox
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function AdminCommitteeMembers() {
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fetchCommitteeList = async () => {
    try {
      const params = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      const res = await getCommitteeMembers(params);
      if (res && res.success) {
        setMembers(res.users || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load committee member registry.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchCommitteeList();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  const handleToggleStatus = async (userRecord) => {
    const nextStatus = !userRecord.isActive;
    const label = nextStatus ? "activate" : "deactivate";

    // Self suspension block check
    if (currentUser.id === userRecord._id || currentUser.id === userRecord.id) {
      toast.error("You cannot suspend your own access credentials!");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${label} access for ${userRecord.fullName}?`)) {
      return;
    }

    const toastId = toast.loading(`${nextStatus ? "Activating" : "Suspending"} user account...`);
    try {
      await updateUser(userRecord._id || userRecord.id, { isActive: nextStatus });
      toast.success(`Account ${nextStatus ? "activated" : "suspended"} successfully!`, { id: toastId });
      fetchCommitteeList();
    } catch (err) {
      toast.error(err.message || "Failed to toggle status.", { id: toastId });
    }
  };

  const handleDeleteClick = async (userRecord) => {
    // Self deletion block check
    if (currentUser.id === userRecord._id || currentUser.id === userRecord.id) {
      toast.error("You cannot delete your own admin account!");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the committee member account for ${userRecord.fullName}? This is irreversible.`)) {
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

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">

      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4 select-none">
        <div>
          <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
            Management Desk
          </span>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
            Committee Registry
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
          Add Member
        </Button>
      </div>

      {/* 2. Search Box */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-primary/5 p-4 rounded-md select-none">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface text-text text-sm border border-primary/10 rounded-[4px] pl-9 pr-3 py-2 focus:outline-none focus:border-accent font-sans"
          />
          <Search className="w-4 h-4 text-text/40 absolute left-3 top-2.5 stroke-[1.5]" />
        </div>
        <div className="text-xs font-mono text-text/60">
          <span>Active board: {totalCount} committee members registered</span>
        </div>
      </div>

      {/* 3. Members List */}
      {loading ? (
        <PageLoader message="Syncing committee registers..." />
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
              Reload Board Registry
            </Button>
          </Card>
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Committee Members Registered"
          description="Click Add Member above to register a new committee account."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {members.map((m) => {
              const isSelf = currentUser.id === m._id || currentUser.id === m.id;

              return (
                <Card
                  key={m._id || m.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border border-primary/10 hover:border-primary/20 hover:bg-surface/50 transition-all rounded-[4px]"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="w-11 h-11 border border-primary/10 rounded-[3px] bg-black/5 flex items-center justify-center shrink-0 select-none">
                      <UserSquare2 className="w-5 h-5 text-text/30" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 select-none">
                        <StampBadge status={m.isActive ? "active" : "deactivated"} />
                        <span className="bg-accent/5 text-accent font-mono text-[9px] border border-accent/20 px-1.5 py-0.2 rounded-[2px] uppercase">
                          {m.designation}
                        </span>
                        {isSelf && (
                          <span className="bg-primary/10 text-primary font-mono text-[9px] px-1.5 py-0.2 rounded-[2px]">
                            You
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-extrabold text-primary leading-tight mt-1 truncate">
                        {m.fullName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text/50 mt-1 select-none">
                        <span className="break-all">Email: {m.email}</span>
                        {m.phone && (
                          <>
                            <span>•</span>
                            <span>Phone: {m.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operations controls */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0 select-none">

                    {/* Status Toggle */}
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(m)}
                        className={`text-xs font-mono border px-3 py-1.5 ${m.isActive
                            ? "text-warning border-warning/20 bg-warning/5 hover:bg-warning/10"
                            : "text-success border-success/20 bg-success/5 hover:bg-success/10"
                          }`}
                      >
                        {m.isActive ? "Suspend" : "Activate"}
                      </Button>
                    )}

                    {/* Password Reset */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResettingPasswordUser(m)}
                      className="p-2 text-text/40 hover:text-accent border border-primary/10 bg-black/5"
                    >
                      <Lock className="w-4 h-4" />
                    </Button>

                    {/* Edit Profile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingUser(m);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-text/40 hover:text-primary border border-primary/10 bg-black/5"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* Delete Soft delete */}
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(m)}
                        className="p-2 text-text/40 hover:text-danger border border-primary/10 bg-black/5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

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

      {/* 4. Shared User Form Modal */}
      {isFormOpen && (
        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          role="committee_member"
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
                <div><span className="text-text/50">Member Name:</span> <span className="font-bold text-primary">{resettingPasswordUser.fullName}</span></div>
                <div><span className="text-text/50">Designation:</span> <span className="font-bold text-primary">{resettingPasswordUser.designation}</span></div>
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
