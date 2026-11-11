import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  X,
  Clock,
  AlertCircle,
  Check,
  Lock,
  Info,
} from 'lucide-react';
import { TSPStatusOption, TOMS_OPTIONS, TOMOption } from '../../types/privacy';

export interface SecurityMeasuresSectionProps {
  tspStatus?: TSPStatusOption | string;
  tspJustification?: string;
  toms?: string[];
  tomsOther?: string;
  onTspStatusChange: (status: TSPStatusOption) => void;
  onTspJustificationChange: (justification: string) => void;
  onTomsChange: (toms: string[]) => void;
  onTomsOtherChange: (otherDesc: string) => void;
  tomOptions?: readonly string[];
  tspStatusOptions?: readonly string[];
  readOnly?: boolean;
  className?: string;
  /** When provided, "Yes" for TSP registration shows a searchable picker to attach TSP inventory records */
  tspRecords?: { id: string; name: string; status?: string }[];
  selectedTspRecordIds?: string[];
  onTspRecordIdsChange?: (ids: string[]) => void;
  /** Set to false to hide the "Record Scope Notice" under the TOMs section */
  showScopeNotice?: boolean;
}

export const SecurityMeasuresSection: React.FC<SecurityMeasuresSectionProps> = ({
  tspStatus = '',
  tspJustification = '',
  toms = [],
  tomsOther = '',
  onTspStatusChange,
  onTspJustificationChange,
  onTomsChange,
  onTomsOtherChange,
  tomOptions = TOMS_OPTIONS,
  tspStatusOptions = ['Yes', 'No', 'Pending', 'N/A'],
  readOnly = false,
  className = '',
  tspRecords,
  selectedTspRecordIds = [],
  onTspRecordIdsChange,
  showScopeNotice = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tspSearchTerm, setTspSearchTerm] = useState('');

  const tspRecordsById = useMemo(() => new Map((tspRecords || []).map(r => [r.id, r])), [tspRecords]);
  const filteredTspRecords = useMemo(() => {
    const query = tspSearchTerm.trim().toLowerCase();
    const records = tspRecords || [];
    if (!query) return records;
    return records.filter(
      r =>
        r.id.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        (r.status || '').toLowerCase().includes(query)
    );
  }, [tspRecords, tspSearchTerm]);

  const toggleTspRecord = (id: string) => {
    if (readOnly || !onTspRecordIdsChange) return;
    if (selectedTspRecordIds.includes(id)) {
      onTspRecordIdsChange(selectedTspRecordIds.filter(x => x !== id));
    } else {
      onTspRecordIdsChange([...selectedTspRecordIds, id]);
    }
  };

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const options = Array.from(new Set([...tomOptions, ...toms]));
    if (!searchTerm.trim()) return options;
    const query = searchTerm.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(query));
  }, [searchTerm, tomOptions, toms]);

  const toggleTom = (option: string) => {
    if (readOnly) return;
    if (toms.includes(option)) {
      onTomsChange(toms.filter(t => t !== option));
    } else {
      onTomsChange([...toms, option]);
    }
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onTomsChange([]);
    onTomsOtherChange('');
  };

  const removeChip = (option: string) => {
    if (readOnly) return;
    onTomsChange(toms.filter(t => t !== option));
    if (option === 'Other') {
      onTomsOtherChange('');
    }
  };

  const isOtherSelected = toms.includes('Other');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. TSP REGISTRATION QUESTION SECTION */}
      <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              TSP Registration Status
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify if this product or system is registered in the Trimble Technical Service Provider (TSP) catalog.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Is the product registered in the TSP? <span className="text-rose-600">*</span>
          </label>

          {/* Radio Button Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from(new Set([...tspStatusOptions, tspStatus].filter(Boolean))).map(option => {
              const isSelected = tspStatus === option;
              let activeColorClasses = 'border-slate-200 bg-white hover:border-slate-300 text-slate-700';
              if (isSelected) {
                if (option === 'Yes') {
                  activeColorClasses = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold';
                } else if (option === 'Pending') {
                  activeColorClasses = 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-bold';
                } else if (option === 'N/A') {
                  activeColorClasses = 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 font-bold';
                } else {
                  activeColorClasses = 'border-slate-400 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20 font-bold';
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onTspStatusChange(option as TSPStatusOption)}
                  className={`p-3 rounded-lg border text-center transition flex items-center justify-center gap-2 text-xs cursor-pointer ${activeColorClasses}`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? option === 'Yes'
                          ? 'border-emerald-600 bg-emerald-600'
                          : option === 'Pending'
                          ? 'border-amber-600 bg-amber-600'
                          : option === 'N/A'
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-slate-700 bg-slate-700'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Pending Status Badge */}
          {tspStatus === 'Pending' && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold text-amber-950">TSP Registration Status:</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-950 border border-amber-400 text-[11px] font-bold uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-amber-800" />
                TSP Registration Pending
              </span>
            </div>
          )}

          {/* N/A Required Justification Text Field */}
          {tspStatus === 'N/A' && (
            <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-slate-700 block">
                Please provide justification. <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={tspJustification}
                onChange={e => onTspJustificationChange(e.target.value)}
                placeholder="Explain why TSP registration is not applicable to this product or activity..."
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 outline-none transition ${
                  !tspJustification.trim()
                    ? 'border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                    : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              {!tspJustification.trim() && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Justification is required when N/A is selected for TSP registration.
                </p>
              )}
            </div>
          )}

          {/* TSP Inventory Picker: shown when registered in the TSP */}
          {tspStatus === 'Yes' && tspRecords && onTspRecordIdsChange && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Attach TSP inventory records
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedTspRecordIds.length} attached
                </span>
              </div>

              {selectedTspRecordIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTspRecordIds.map(id => {
                    const record = tspRecordsById.get(id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-emerald-200 text-xs font-medium text-slate-800"
                      >
                        <span className="font-mono text-[11px] font-semibold text-slate-500">{id}</span>
                        <span className="max-w-[180px] truncate">{record?.name || 'Unknown record'}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => toggleTspRecord(id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Remove TSP record"
                            aria-label={`Remove ${id}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  disabled={readOnly}
                  value={tspSearchTerm}
                  onChange={e => setTspSearchTerm(e.target.value)}
                  placeholder={`Search ${(tspRecords || []).length} TSP inventory records by ID, name, or status...`}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                {filteredTspRecords.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No TSP records match</div>
                ) : (
                  filteredTspRecords.map(record => {
                    const isSelected = selectedTspRecordIds.includes(record.id);
                    return (
                      <button
                        key={record.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleTspRecord(record.id)}
                        className={`w-full text-left px-2.5 py-2 flex items-center justify-between gap-2 text-xs transition ${
                          isSelected ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-slate-500 font-semibold shrink-0">{record.id}</span>
                          <span className="truncate">{record.name}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          {record.status && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                              {record.status}
                            </span>
                          )}
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TECHNICAL AND ORGANISATIONAL SECURITY MEASURES (TOMs) SECTION */}
      <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Technical & Organisational Security Measures (TOMs)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Select all security controls, access safeguards, and technical policies implemented for this record.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
            {toms.length} selected
          </span>
        </div>

        {/* Toolbar: Search + Clear selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search security controls (e.g., Encryption, SSO, Logging)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {toms.length > 0 && !readOnly && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold text-xs transition shrink-0"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Selected Chips / Tags Container */}
        {toms.length > 0 && (
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Controls ({toms.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {toms.map(opt => (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200"
                >
                  <span>{opt}</span>
                  {opt === 'Other' && tomsOther && (
                    <span className="text-[11px] font-normal text-indigo-700 italic">({tomsOther})</span>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeChip(opt)}
                      className="text-indigo-400 hover:text-indigo-700 transition"
                      title={`Remove ${opt}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checkbox Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {filteredOptions.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-xs text-slate-400 italic bg-white rounded-lg border border-slate-200">
              No security controls match "{searchTerm}"
            </div>
          ) : (
            filteredOptions.map(option => {
              const checked = toms.includes(option);
              return (
                <label
                  key={option}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    checked
                      ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={checked}
                      onChange={() => toggleTom(option)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{option}</span>
                  </div>
                  {checked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </label>
              );
            })
          )}
        </div>

        {/* Conditional "Other" Text Field */}
        {isOtherSelected && (
          <div className="space-y-1.5 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
            <label className="text-xs font-semibold text-slate-700 block">
              Please describe the additional control <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={tomsOther}
              onChange={e => onTomsOtherChange(e.target.value)}
              placeholder="Provide details of custom or proprietary security measures..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            {!tomsOther.trim() && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Please describe the specific control for "Other".
              </p>
            )}
          </div>
        )}

        {/* Distinctness Note */}
        {showScopeNotice && (
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Record Scope Notice:</strong> Security controls selected here are recorded specifically for this item. Linked Assets or Vendors maintain distinct security profiles.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
