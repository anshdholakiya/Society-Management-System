import React from "react";
import { useLocation } from "react-router-dom";
import Card from "../../components/ui/Card";
import StampBadge from "../../components/ui/StampBadge";

export default function PlaceholderPage({ title, breadcrumb }) {
  const location = useLocation();

  // Dynamically compute titles from path if not provided as props
  const getPageMeta = () => {
    if (title && breadcrumb) return { title, breadcrumb };

    const segments = location.pathname.split("/").filter(Boolean);
    const domain = segments[0] || "system"; // e.g., 'admin', 'resident'
    const section = segments[1] || "dashboard"; // e.g., 'residents', 'complaints'

    const formattedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
    const formattedSection = section
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      breadcrumb: `${formattedDomain} Ledger / ${formattedSection}`,
      title: formattedSection,
    };
  };

  const meta = getPageMeta();

  return (
    <div className="w-full text-left font-sans animate-fade-in">
      {/* Breadcrumb Info */}
      <div className="mb-4 text-xs font-mono tracking-wider text-text/50 uppercase select-none">
        {meta.breadcrumb}
      </div>

      {/* Main Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-4 mb-6">
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight">
          {meta.title}
        </h2>
        <StampBadge status="Open" />
      </div>

      {/* Content Surface Card */}
      <Card className="bg-surface/50 border border-primary/10">
        <div className="py-12 text-center max-w-lg mx-auto">
          <h3 className="font-display font-semibold text-lg text-primary mb-2">
            Ledger Section in Preparation
          </h3>
          <p className="text-sm text-text/80 leading-relaxed font-sans">
            The data schema and interfaces for the **{meta.title}** ledger are currently offline for development. 
            Real data actions for this block will be initialized in subsequent phases.
          </p>
        </div>
      </Card>
    </div>
  );
}
