import React from "react";
import Button from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 font-mono text-xs select-none ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === 1}
        onClick={handlePrev}
        className="px-2"
        title="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return (
          <Button
            key={p}
            variant={isCurrent ? "primary" : "secondary"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center p-0 rounded-sm font-semibold ${
              isCurrent ? "border-primary" : ""
            }`}
          >
            {p}
          </Button>
        );
      })}

      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={handleNext}
        className="px-2"
        title="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
