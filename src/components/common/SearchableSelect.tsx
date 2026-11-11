import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

/**
 * Single-select dropdown where the user can type to filter options.
 * Clicking the clear button (or leaving the input empty) resets the selection to "".
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search or select...',
  helperText,
  disabled = false,
}) => {
  const generatedId = useId();
  const inputId = id || `searchable-select-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = options.find(option => option.value === value)?.label || '';

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query]);

  // Close the list when clicking anywhere outside this control
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="w-full" ref={rootRef}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs text-slate-700 mb-1.5 font-bold`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={isOpen ? query : selectedLabel}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setQuery('');
            }
          }}
          onChange={event => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              setQuery('');
            } else if (event.key === 'Enter' && isOpen) {
              event.preventDefault();
              if (filteredOptions.length > 0) choose(filteredOptions[0].value);
            }
          }}
          className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-8 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-100 disabled:text-slate-500"
        />
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={event => event.preventDefault()}
            onClick={() => choose('')}
            aria-label="Clear selection"
            title="Clear selection"
            className="absolute right-2 top-2 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {isOpen && !disabled && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">No matches found</li>
            ) : (
              filteredOptions.map(option => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => choose(option.value)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition ${
                      option.value === value
                        ? 'bg-slate-100 font-normal text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
