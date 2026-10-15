import React from 'react';
import { AssessmentStatus } from '../../types/assessment';

interface ChoiceFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
}

export const ChoiceField: React.FC<ChoiceFieldProps> = ({
  label,
  value,
  options,
  onChange,
  helperText,
  error,
}) => {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-800 leading-snug">{label}</legend>
      {helperText && <p className="text-xs text-slate-500 leading-relaxed">{helperText}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                selected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </fieldset>
  );
};

export const AssessmentStatusBadge: React.FC<{ status: AssessmentStatus }> = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  if (status === 'In Progress') {
    style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dot = 'bg-indigo-500';
  } else if (status === 'Under Review') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
    dot = 'bg-amber-500';
  } else if (status === 'Completed') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};

export const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => {
  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {children}
    </section>
  );
};

export const ReadOnlyChips: React.FC<{ items: string[]; emptyLabel: string }> = ({ items, emptyLabel }) => {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 italic">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item}
          className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
};
