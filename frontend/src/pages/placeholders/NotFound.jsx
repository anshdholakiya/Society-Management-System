import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import StampBadge from "../../components/ui/StampBadge";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
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
    <div className="w-full max-w-md mx-auto text-center font-sans py-12 select-none animate-fade-in">
      <div className="bg-surface border border-primary/15 rounded-md p-8 relative shadow-sm">
        
        {/* Corner Decor Pin */}
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-accent rounded-full border border-primary/10 shadow-sm" />
        </div>

        <FileQuestion className="w-16 h-16 text-accent mx-auto mb-4 stroke-[1.5]" />

        <h2 className="text-3xl font-display font-bold text-primary mb-2">Page Not Found</h2>
        
        <p className="text-sm text-text/80 mb-6 leading-relaxed">
          The registry page or workspace module you requested does not exist or has been restricted.
        </p>

        <div className="mb-6 flex justify-center">
          <StampBadge status="Closed" className="text-sm scale-110" />
        </div>

        <Button variant="primary" onClick={handleReturn} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
