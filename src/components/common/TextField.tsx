import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  multiline = false,
  rows = 3,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const inputClasses = `w-full rounded-md border text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition ${
    error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-300'
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={inputId}
          rows={rows}
          className={inputClasses}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input id={inputId} className={inputClasses} {...props} />
      )}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
