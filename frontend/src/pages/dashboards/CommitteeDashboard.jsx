import React from "react";
import { useAuth } from "../../context/AuthContext";
import StampBadge from "../../components/ui/StampBadge";
import Card from "../../components/ui/Card";
import { ClipboardList } from "lucide-react";

export default function CommitteeDashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-2xl bg-surface border border-primary/10 rounded-md p-6 mt-4 text-left">
      <div className="flex justify-between items-start border-b border-primary/10 pb-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Committee Panel</h2>
          <p className="text-sm font-sans text-text/70 mt-1">Society Operational Action Center</p>
        </div>
        <StampBadge status="Resolved" />
      </div>

      <div className="space-y-6 font-sans">
        <Card className="bg-background/20">
          <h3 className="font-display font-semibold text-lg text-primary mb-3">Committee Representative Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm font-sans">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-text/50">Full Name</span>
              <p className="font-medium text-text mt-0.5">{user?.fullName}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-text/50">Email Address</span>
              <p className="font-medium text-text mt-0.5">{user?.email}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-text/50">Board Designation</span>
              <p className="font-medium text-text mt-0.5">{user?.designation || "Committee Member"}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-text/50">Phone Number</span>
              <p className="font-medium text-text mt-0.5">{user?.phone || "Not recorded"}</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between border-t border-primary/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-text/60 font-mono">
            <ClipboardList className="w-4 h-4 text-success" />
            <span>Assigned Maintenance Task View</span>
          </div>
        </div>
      </div>
    </div>
  );
}

