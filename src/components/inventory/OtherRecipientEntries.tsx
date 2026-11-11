import React from 'react';
import { Check, Trash2, X } from 'lucide-react';

interface OtherRecipientEntriesProps {
  label: string;
  placeholder: string;
  entries: string[];
  draft: string | null;
  accent: 'indigo' | 'amber';
  onDraftChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onRemove: (index: number) => void;
}

const FOCUS_RING: Record<OtherRecipientEntriesProps['accent'], string> = {
  indigo: 'focus:ring-indigo-500 focus:border-indigo-500',
  amber: 'focus:ring-amber-500 focus:border-amber-500',
};

const SAVE_BUTTON: Record<OtherRecipientEntriesProps['accent'], string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
};

/**
 * Saved "Other" recipient entries plus the input used to add a new one.
 * The input is half width, and a tick button saves the entry as a separate choice.
 */
export const OtherRecipientEntries: React.FC<OtherRecipientEntriesProps> = ({
  label,
  placeholder,
  entries,
  draft,
  accent,
  onDraftChange,
  onCommit,
  onCancel,
  onRemove,
}) => {
  if (entries.length === 0 && draft === null) return null;

  return (
    <div className="pt-2 space-y-2 animate-in fade-in duration-150">
      {entries.length > 0 && (
        <ul className="space-y-1.5 w-1/2">
          {entries.map((entry, index) => (
            <li
              key={`${entry}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800"
            >
              <span className="truncate">{entry}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${entry}`}
                title="Remove"
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft !== null && (
        <div className="w-1/2 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              placeholder={placeholder}
              onChange={e => onDraftChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (draft.trim()) onCommit();
                }
                if (e.key === 'Escape') onCancel();
              }}
              className={`flex-1 min-w-0 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 ${FOCUS_RING[accent]}`}
            />
            <button
              type="button"
              onClick={onCommit}
              disabled={!draft.trim()}
              aria-label="Save this entry"
              title="Save this entry"
              className={`p-2 rounded-md text-white transition disabled:bg-slate-300 disabled:cursor-not-allowed ${SAVE_BUTTON[accent]}`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel this entry"
              title="Cancel"
              className="p-2 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
