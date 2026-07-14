import React, { useState, useEffect } from "react";
import { getAnnouncements } from "../../api/announcements";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import AnnouncementDetailsModal from "./AnnouncementDetailsModal";
import { 
  Megaphone, 
  AlertTriangle, 
  Calendar, 
  User, 
  Eye, 
  RefreshCw, 
  Clock,
  Sparkles,
  Inbox
} from "lucide-react";
import Button from "../../components/ui/Button";

export default function ResidentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // LocalStorage read logs tracking
  const [readNoticeIds, setReadNoticeIds] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    // Load local read logs
    try {
      const stored = localStorage.getItem("read_announcements_index");
      if (stored) {
        setReadNoticeIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load read logs index:", e);
    }
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
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
      setError(err.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const handleNoticeClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    
    // Log as read if not already tracked
    if (!readNoticeIds.includes(announcement._id)) {
      const updated = [...readNoticeIds, announcement._id];
      setReadNoticeIds(updated);
      try {
        localStorage.setItem("read_announcements_index", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read logs index:", e);
      }
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

  // Separate Urgent / Pinned items from Normal items
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const priorityWeight = { urgent: 3, important: 2, normal: 1 };
    const weightA = priorityWeight[a.priority] || 1;
    const weightB = priorityWeight[b.priority] || 1;
    if (weightB !== weightA) {
      return weightB - weightA;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="w-full text-left font-sans animate-fade-in space-y-6">
      
      {/* 1. Header Title */}
      <div className="border-b border-primary/15 pb-4 select-none">
        <span className="text-xs font-mono text-text/50 uppercase tracking-wider">
          Resident Bulletin
        </span>
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight mt-0.5">
          Announcements & Notices
        </h2>
      </div>

      {/* 2. Feed Body */}
      {loading ? (
        <PageLoader message="Syncing society notice board..." />
      ) : error ? (
        <div className="w-full text-center py-12">
          <Card className="border-danger/30 p-8 max-w-xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-lg text-primary mb-2">Notice Sync Failed</h3>
            <p className="text-sm text-text/80 mb-6 leading-relaxed">
              Connection error: <span className="font-mono text-xs bg-danger/5 px-1.5 py-0.5 border border-danger/10 text-danger rounded-[2px]">{error}</span>
            </p>
            <Button variant="primary" onClick={fetchAnnouncements} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Bulletin Board
            </Button>
          </Card>
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Board is Empty"
          description="There are no active notices targeting your block/unit range today."
        />
      ) : (
        <div className="space-y-4">
          
          {/* Feed List */}
          <div className="grid grid-cols-1 gap-4">
            {sortedAnnouncements.map((a) => {
              const isUnread = !readNoticeIds.includes(a._id);
              const isUrgent = a.priority === "urgent";
              const isImportant = a.priority === "important";

              // Borders and styling triggers based on priorities
              const cardClass = isUrgent
                ? "border-danger/30 bg-danger/5 hover:border-danger/45"
                : isImportant 
                  ? "border-warning/30 bg-warning/5 hover:border-warning/45"
                  : "border-primary/10 hover:border-primary/20 hover:bg-surface/50";

              return (
                <Card 
                  key={a._id}
                  onClick={() => handleNoticeClick(a)}
                  className={`flex flex-col sm:flex-row items-start justify-between gap-4 py-4 transition-all cursor-pointer group rounded-[4px] border ${cardClass}`}
                >
                  <div className="flex gap-4 items-start min-w-0">
                    {/* Icon block */}
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
                      <div className="flex flex-wrap items-center gap-2 select-none">
                        
                        {/* Status stamp */}
                        <StampBadge 
                          status={a.expiresAt && new Date(a.expiresAt) <= new Date() ? "Expired" : "Active"} 
                          className="scale-90"
                        />

                        {/* Priority indicator */}
                        <span className={`text-[10px] font-mono font-bold uppercase ${
                          a.priority === "urgent" ? "text-danger" : (a.priority === "important" ? "text-warning" : "text-text/40")
                        }`}>
                          {a.priority}
                        </span>

                        {/* Unread "New" tag */}
                        {isUnread && (
                          <span className="bg-success text-success-foreground font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-wider uppercase animate-pulse">
                            New
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-text/40">Posted: {formatDate(a.createdAt)}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-extrabold text-primary group-hover:text-accent transition-colors leading-tight truncate">
                        {a.title}
                      </h3>

                      {/* Content snippet */}
                      <p className="text-xs text-text/60 leading-normal line-clamp-2 pr-6">
                        {a.content}
                      </p>

                      {/* Publisher designation badge */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-text/40 pt-1 select-none">
                        <User className="w-3.5 h-3.5" />
                        <span>By: {a.publishedBy?.fullName} ({a.publishedBy?.designation || "Admin"})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-auto shrink-0 select-none">
                    <Button 
                      variant="ghost" 
                      size="sm" 
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

      {/* 3. Details Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}

    </div>
  );
}
