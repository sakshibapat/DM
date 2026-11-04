import React from 'react';
import { Check, X } from 'lucide-react';
import { isPresetSafeguard, SAFEGUARD_PRESETS, SafeguardPreset } from '../../utils/destinationSafeguards';

export type SafeguardView = 'choices' | 'other-draft' | 'saved-text';

interface DestinationSafeguardControlProps {
  assetId: string;
  question?: string;
  value: string;
  view: SafeguardView;
  draft: string;
  onSelectPreset: (assetId: string, value: SafeguardPreset) => void;
  onClear: (assetId: string) => void;
  onStartOther: (assetId: string) => void;
  onDraftChange: (assetId: string, draft: string) => void;
  onSaveOther: (assetId: string) => void;
}

export const DestinationSafeguardControl: React.FC<DestinationSafeguardControlProps> = ({
  assetId,
  question = 'What transfer safeguards are in place between the source and destination assets?',
  value,
  view,
  draft,
  onSelectPreset,
  onClear,
  onStartOther,
  onDraftChange,
  onSaveOther,
}) => {
  const selectedPreset = isPresetSafeguard(value) ? value : '';
  const savedOther = view === 'saved-text' && value && !selectedPreset ? value : '';

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <label className="block text-xs font-bold text-slate-900">
        {question}
      </label>
      {view === 'other-draft' ? (
        <div className="relative max-w-xl">
          <input
            type="text"
            value={draft}
            onChange={event => onDraftChange(assetId, event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSaveOther(assetId);
              }
            }}
            placeholder="Describe the transfer safeguard"
            aria-label="Other transfer safeguard"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
          />
          <button
            type="button"
            onClick={() => onSaveOther(assetId)}
            disabled={!draft.trim()}
            aria-label="Save transfer safeguard"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-indigo-700 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : savedOther ? (
        <div className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 pl-3.5 pr-1 py-1">
          <button
            type="button"
            onClick={() => onClear(assetId)}
            className="cursor-pointer text-left text-xs font-semibold text-indigo-950"
          >
            {savedOther}
          </button>
          <button
            type="button"
            onClick={() => onClear(assetId)}
            aria-label="Remove saved safeguard"
            className="cursor-pointer rounded p-1 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-950"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {SAFEGUARD_PRESETS.map(option => (
            <label
              key={option}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                selectedPreset === option
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <input
                type="radio"
                name={`transferSafeguard-${assetId}`}
                value={option}
                checked={selectedPreset === option}
                onClick={() => {
                  if (selectedPreset === option) onClear(assetId);
                }}
                onChange={() => {
                  if (selectedPreset === option) {
                    onClear(assetId);
                    return;
                  }
                  onSelectPreset(assetId, option);
                }}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              {option}
            </label>
          ))}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/80">
            <input
              type="radio"
              name={`transferSafeguard-${assetId}`}
              value="Other"
              checked={false}
              onChange={() => onStartOther(assetId)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Other
          </label>
        </div>
      )}
    </div>
  );
};
