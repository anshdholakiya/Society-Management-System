import React from "react";

const Select = React.forwardRef(({
  label,
  name,
  error,
  options = [],
  className = "",
  required = false,
  placeholder = null,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-full text-left font-sans ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-primary/80 block select-none">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        name={name}
        ref={ref}
        required={required}
        className={`w-full bg-surface text-text text-sm border border-primary/20 rounded-[4px] px-3 py-2 outline-none transition-colors focus:border-accent font-sans ${
          error ? "border-danger focus:border-danger ring-1 ring-danger/25" : ""
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs font-mono text-danger mt-0.5">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = "Select";

export default Select;
