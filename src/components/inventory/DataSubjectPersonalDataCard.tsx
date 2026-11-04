import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  Briefcase,
  UserCheck,
  Search,
  X,
  AlertTriangle,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import {
  CONTROLLED_PERSONAL_DATA_ITEMS,
  getPersonalDataMetadata,
  PersonalDataClassification,
} from '../../data/personalDataCatalog';

interface DataSubjectPersonalDataCardProps {
  subjectCategory: string;
  assignedDataItems: string[];
  availableDataItems?: readonly string[];
  onChangeDataItems: (newItems: string[]) => void;
  onRemoveSubjectCategory: () => void;
  reveal?: boolean;
}

export const DataSubjectPersonalDataCard: React.FC<DataSubjectPersonalDataCardProps> = ({
  subjectCategory,
  assignedDataItems,
  availableDataItems = CONTROLLED_PERSONAL_DATA_ITEMS,
  onChangeDataItems,
  onRemoveSubjectCategory,
  reveal = false,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'All' | 'High Risk' | PersonalDataClassification>('All');

  useEffect(() => {
    if (!reveal || !listRef.current) return;
    const node = listRef.current;
    const frame = requestAnimationFrame(() => {
      const scroller = node.closest('form');
      if (!scroller) return;
      const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [reveal, subjectCategory]);

  // Choose icon based on category name
  const getSubjectIcon = (cat: string) => {
    if (cat.toLowerCase().includes('customer') || cat.toLowerCase().includes('prospect')) {
      return <Users className="w-5 h-5 text-indigo-600" />;
    }
    if (
      cat.toLowerCase().includes('employee') ||
      cat.toLowerCase().includes('candidate') ||
      cat.toLowerCase().includes('contractor')
    ) {
      return <Briefcase className="w-5 h-5 text-emerald-600" />;
    }
    return <UserCheck className="w-5 h-5 text-purple-600" />;
  };

  // Filter available items
  const filteredItems = useMemo(() => {
    return Array.from(new Set([...availableDataItems, ...assignedDataItems])).filter(itemName => {
      const meta = getPersonalDataMetadata(itemName);
      // Search query filter
      const matchesSearch =
        itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.regulatoryTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        meta.classification.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Classification filter
      if (classificationFilter === 'All') return true;
      if (classificationFilter === 'High Risk') return meta.isHighRisk;
      return meta.classification === classificationFilter;
    });
  }, [availableDataItems, assignedDataItems, searchQuery, classificationFilter]);

  const toggleItem = (itemName: string) => {
    if (assignedDataItems.includes(itemName)) {
      onChangeDataItems(assignedDataItems.filter(i => i !== itemName));
    } else {
      onChangeDataItems([...assignedDataItems, itemName]);
    }
  };

  const selectAllFiltered = () => {
    const combined = Array.from(new Set([...assignedDataItems, ...filteredItems]));
    onChangeDataItems(combined);
  };

  const clearAll = () => {
    onChangeDataItems([]);
  };

  // High risk items assigned to this data subject
  const highRiskAssignedCount = assignedDataItems
    .map(getPersonalDataMetadata)
    .filter(m => m.isHighRisk).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm transition-all duration-150 hover:border-slate-300">
      {/* Card Header */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            {getSubjectIcon(subjectCategory)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {subjectCategory}
              {highRiskAssignedCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  {highRiskAssignedCount} High Risk
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {assignedDataItems.length === 0
                ? 'No personal data categories assigned yet.'
                : `${assignedDataItems.length} personal data category(ies) mapped.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assignedDataItems.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition"
            >
              Clear items
            </button>
          )}
          <button
            type="button"
            onClick={onRemoveSubjectCategory}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition flex items-center gap-1"
            title="Remove Data Subject category"
          >
            <X className="w-3.5 h-3.5" />
            Remove Category
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Personal data categories, shown as soon as this data subject is chosen */}
        <div ref={listRef} className="space-y-2 scroll-mt-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Select Categories of Personal Data for <span className="text-indigo-600">{subjectCategory}</span>:
          </label>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50/90 border-b border-slate-200 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search personal data categories..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {(['All', 'High Risk', 'Restricted', 'Confidential', 'Internal'] as const).map(filterVal => {
                  const isActive = classificationFilter === filterVal;
                  return (
                    <button
                      key={filterVal}
                      type="button"
                      onClick={() => setClassificationFilter(filterVal)}
                      className={`px-2 py-0.5 rounded-full font-semibold transition ${
                        isActive
                          ? filterVal === 'High Risk'
                            ? 'bg-rose-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {filterVal}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] font-medium text-slate-500">
                <span>Showing {filteredItems.length} of {availableDataItems.length} items</span>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Select All Filtered
                </button>
              </div>
            </div>

            <div className="p-2 divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching personal data categories found.
                </div>
              ) : (
                filteredItems.map(itemName => {
                  const isChecked = assignedDataItems.includes(itemName);
                  const meta = getPersonalDataMetadata(itemName);
                  return (
                    <label
                      key={itemName}
                      className={`p-2 rounded-lg flex items-start gap-2.5 cursor-pointer transition select-none ${
                        isChecked ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(itemName)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-900 font-medium leading-tight">
                            {itemName}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <ClassificationBadge classification={meta.classification} />
                            {meta.isHighRisk && (
                              <span className="inline-flex items-center gap-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                High Risk
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {meta.regulatoryTags.map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {meta.description && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs ml-1">
                              — {meta.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selected Items Grid / Badges */}
        {assignedDataItems.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Assigned Personal Data Categories ({assignedDataItems.length}):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignedDataItems.map(itemName => {
                const meta = getPersonalDataMetadata(itemName);
                return (
                  <div
                    key={itemName}
                    className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 transition ${
                      meta.isHighRisk
                        ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                        : meta.classification === 'Restricted'
                        ? 'bg-purple-50/40 border-purple-200 text-slate-900'
                        : meta.classification === 'Confidential'
                        ? 'bg-amber-50/40 border-amber-200 text-slate-900'
                        : 'bg-slate-50/80 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 leading-tight">
                        <span className="truncate">{itemName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <ClassificationBadge classification={meta.classification} />
                        <RiskBadge riskLevel={meta.riskLevel} isHighRisk={meta.isHighRisk} />
                        {meta.regulatoryTags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] bg-white/80 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleItem(itemName)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-1 rounded transition shrink-0"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Helper badge for classification
function ClassificationBadge({ classification }: { classification: PersonalDataClassification }) {
  if (classification === 'Restricted') {
    return (
      <span className="inline-flex items-center gap-0.5 bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
        Restricted
      </span>
    );
  }
  if (classification === 'Confidential') {
    return (
      <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
        Confidential
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
      Internal
    </span>
  );
}

// Helper badge for risk level
function RiskBadge({ riskLevel, isHighRisk }: { riskLevel: string; isHighRisk: boolean }) {
  if (isHighRisk || riskLevel === 'High') {
    return (
      <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded shadow-2xs">
        <AlertTriangle className="w-2.5 h-2.5" />
        High Risk
      </span>
    );
  }
  if (riskLevel === 'Medium') {
    return (
      <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.2 rounded">
        Medium Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 bg-slate-500 text-white text-[10px] font-medium px-1.5 py-0.2 rounded">
      Low Risk
    </span>
  );
}
