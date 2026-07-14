import React from "react";
import Button from "../../components/ui/Button";
import StampBadge from "../../components/ui/StampBadge";
import { X, Calendar, User, Info, MapPin } from "lucide-react";

export default function AnnouncementDetailsModal({ announcement, onClose }) {
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "urgent": return "Urgent Alert";
      case "important": return "Important notice";
      default: return "Information";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 flex items-center justify-center p-4">
      <div className="bg-surface border border-primary/20 rounded-md max-w-xl w-full relative flex flex-col shadow-lg animate-fade-in text-left">
        
        {/* Header */}
        <div className="h-14 border-b border-primary/10 flex items-center justify-between px-6 bg-primary/5 select-none">
          <div>
            <span className="text-[10px] font-mono text-text/50 uppercase tracking-wider">Announcement Dossier</span>
            <h4 className="font-display font-bold text-sm text-primary -mt-0.5">
              Notice Details
            </h4>
          </div>
          <button 
            onClick={onClose} 
            className="text-text/75 hover:text-primary hover:bg-primary/5 p-1 rounded-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] font-sans">
          
          {/* Title & Priority Badge */}
          <div className="space-y-2 border-b border-primary/10 pb-4">
            <div className="flex items-center gap-2">
              <StampBadge status={announcement.expiresAt && new Date(announcement.expiresAt) <= new Date() ? "Expired" : "Active"} />
              <span className={`text-xs font-mono font-bold uppercase ${
                announcement.priority === "urgent" ? "text-danger" : (announcement.priority === "important" ? "text-warning" : "text-text/50")
              }`}>
                {announcement.priority}
              </span>
            </div>
            <h2 className="font-display font-extrabold text-xl text-primary leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-primary/5 p-3 rounded-[3px] border border-primary/10 select-none">
            <div className="flex items-center gap-2 text-text/70">
              <User className="w-4 h-4 text-text/40 shrink-0" />
              <div>
                <span className="text-text/40 block text-[9px] uppercase">Published By</span>
                <span className="font-bold text-primary">{announcement.publishedBy?.fullName}</span>
                <span className="text-[10px] text-text/50 block font-normal">
                  {announcement.publishedBy?.designation || announcement.publishedBy?.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-text/70 sm:border-l sm:border-primary/10 sm:pl-3">
              <Calendar className="w-4 h-4 text-text/40 shrink-0" />
              <div>
                <span className="text-text/40 block text-[9px] uppercase">Published On</span>
                <span className="font-bold text-primary">{formatDate(announcement.createdAt)}</span>
                {announcement.expiresAt && (
                  <span className="text-[10px] text-danger block font-normal mt-0.5">
                    Expires: {new Date(announcement.expiresAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scope Target Block restriction banner if exists */}
          {announcement.targetBlock && (
            <div className="border border-accent/20 bg-accent/5 p-3 rounded-[3px] flex items-center gap-2 select-none">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <p className="text-[10px] font-mono text-accent">
                NOTICE TARGET: This announcement is restricted to Block <span className="font-bold">{announcement.targetBlock}</span> residents only.
              </p>
            </div>
          )}

          {/* Announcement content markdown block */}
          <div className="text-sm text-text/80 leading-relaxed whitespace-pre-line border border-primary/5 bg-primary/5 p-4 rounded-[3px]">
            {announcement.content}
          </div>

          {/* Image Attachment view */}
          {announcement.imageUrl && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-text/50 select-none">File Attachment</span>
              <div className="border border-primary/10 rounded-[3px] overflow-hidden bg-black/5 flex items-center justify-center p-2">
                <img 
                  src={announcement.imageUrl} 
                  alt="Attachment file" 
                  className="max-h-72 object-contain rounded-[2px] shadow-sm select-all cursor-zoom-in hover:scale-[1.01] transition-transform"
                  onClick={() => window.open(announcement.imageUrl, "_blank")}
                />
              </div>
              <p className="text-[9px] text-center text-text/40 font-mono select-none">
                Click image to view high-resolution file attachment in a new tab.
              </p>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="border-t border-primary/10 p-4 bg-primary/5 rounded-b-md flex justify-end select-none">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onClose}
            className="px-5 py-2 text-xs"
          >
            Close Dossier
          </Button>
        </div>

      </div>
    </div>
  );
}
