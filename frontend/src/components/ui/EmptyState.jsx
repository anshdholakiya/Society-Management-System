import React from "react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 border border-dashed border-primary/20 rounded-lg text-center bg-surface/50 max-w-md mx-auto ${className}`}>
      {Icon && <Icon className="w-12 h-12 text-primary/45 mb-4 stroke-[1.5]" />}
      <h3 className="font-display text-lg font-bold text-primary mb-1">{title}</h3>
      <p className="font-sans text-sm text-text/80 mb-5">{description}</p>
      {actionText && onActionClick && (
        <Button variant="primary" onClick={onActionClick}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
