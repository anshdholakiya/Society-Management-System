import React from "react";

const statusColorMap = {
  // Success / Sage
  paid: "border-success text-success bg-success/5",
  resolved: "border-success text-success bg-success/5",
  completed: "border-success text-success bg-success/5",
  approved: "border-success text-success bg-success/5",
  active: "border-success text-success bg-success/5",
  low: "border-success text-success bg-success/5",

  // Accent / Amber
  unpaid: "border-accent text-accent bg-accent/5",
  pending: "border-accent text-accent bg-accent/5",
  open: "border-accent text-accent bg-accent/5",
  assigned: "border-accent text-accent bg-accent/5",
  in_progress: "border-accent text-accent bg-accent/5",
  medium: "border-accent text-accent bg-accent/5",

  // Danger / Brick Red
  overdue: "border-danger text-danger bg-danger/5",
  rejected: "border-danger text-danger bg-danger/5",
  deactivated: "border-danger text-danger bg-danger/5",
  high: "border-danger text-danger bg-danger/5",
  expired: "border-danger text-danger bg-danger/5",

  // Neutral / Gray/Stone
  closed: "border-neutral text-neutral bg-neutral/5",
  archived: "border-neutral text-neutral bg-neutral/5",
};

export default function StampBadge({ status = "", className = "" }) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const colorClass = statusColorMap[normalizedStatus] || "border-primary text-primary bg-primary/5";

  return (
    <span
      className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border-2 transform -rotate-1 rounded-sm select-none shadow-sm ${colorClass} ${className}`}
      title={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
