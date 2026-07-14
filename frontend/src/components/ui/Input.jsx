import React from "react";

const Input = React.forwardRef(({
  label,
  type = "text",
  name,
  error,
  className = "",
  placeholder = "",
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-full text-left font-sans ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-primary/80 block select-none">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        ref={ref}
        placeholder={placeholder}
        required={required}
        className={`w-full bg-surface text-text text-sm border border-primary/20 rounded-[4px] px-3 py-2 outline-none transition-colors focus:border-accent font-sans ${
          error ? "border-danger focus:border-danger ring-1 ring-danger/25" : ""
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs font-mono text-danger mt-0.5">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
