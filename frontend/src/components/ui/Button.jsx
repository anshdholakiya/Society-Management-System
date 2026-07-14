import React from "react";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  const baseStyle = "inline-flex items-center justify-center font-sans font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-primary text-surface hover:bg-primary/90 border border-primary/20",
    secondary: "bg-surface text-text hover:bg-background border border-primary/15",
    danger: "bg-danger text-surface hover:bg-danger/90 border border-danger/20",
    ghost: "bg-transparent text-text hover:bg-primary/5 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-2.5 text-base rounded-md",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
