import React, { useState } from 'react';
import { TagChip } from './Badge';

interface MultiSelectProps {
  label?: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  presetOptions?: string[];
  placeholder?: string;
  helperText?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  selectedValues,
  onChange,
  presetOptions = [],
  placeholder = 'Add new tag or pick below...',
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddValue = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !selectedValues.includes(trimmed)) {
      onChange([...selectedValues, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveValue = (val: string) => {
    onChange(selectedValues.filter(v => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddValue(inputValue);
    }
  };

  const unusedPresets = presetOptions.filter(opt => !selectedValues.includes(opt));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="p-2 border border-slate-300 rounded-md bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-900/10 transition">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedValues.map(val => (
            <TagChip key={val} label={val} onRemove={() => handleRemoveValue(val)} />
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && handleAddValue(inputValue)}
          placeholder={selectedValues.length === 0 ? placeholder : 'Add another...'}
          className="w-full text-sm text-slate-900 focus:outline-none bg-transparent"
        />
      </div>

      {unusedPresets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 items-center">
          <span className="text-xs text-slate-500 mr-1 font-medium">Suggestions:</span>
          {unusedPresets.slice(0, 6).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddValue(preset)}
              className="text-xs px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              + {preset}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
