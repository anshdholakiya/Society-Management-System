import React from "react";

export function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-t-transparent border-primary/20 border-r-primary ${sizes[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PageLoader({ message = "Loading Notice-board & Ledgers..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8">
      <Spinner size="lg" className="mb-4" />
      <p className="font-display text-sm tracking-wide text-primary/80 font-semibold animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default Spinner;
