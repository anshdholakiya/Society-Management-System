import React from "react";

export default function Card({ children, className = "", ...props }) {
  return (
    <div 
      className={`bg-surface border border-primary/10 rounded-md p-4 text-left font-sans ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
