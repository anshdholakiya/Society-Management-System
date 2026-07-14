import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import StampBadge from "../../components/ui/StampBadge";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "committee_member") {
      navigate("/committee/dashboard");
    } else {
      navigate("/resident/dashboard");
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-surface border border-primary/15 rounded-md p-8 relative">
        {/* Corner Decor Pin */}
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-danger rounded-full border border-primary/10 shadow-sm" />
        </div>

        <ShieldAlert className="w-16 h-16 text-danger mx-auto mb-4 stroke-[1.5]" />
        
        <h2 className="text-3xl font-display font-bold text-primary mb-2">Access Declined</h2>
        <p className="text-sm text-text/80 mb-6 leading-relaxed">
          The registry ledger you attempted to query is restricted. Your account credentials do not possess the required clearance.
        </p>

        <div className="mb-6 flex justify-center">
          <StampBadge status="Rejected" className="text-sm scale-110" />
        </div>

        <Button variant="primary" onClick={handleReturn} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
