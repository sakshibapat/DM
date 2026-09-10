import React, { useState } from 'react';
import { Search, Plus, X, Check, Database, Server, Building2, Globe2, FileText, Cpu, Sparkles } from 'lucide-react';
import { InventoryType, PrivacyRecord } from '../../types/privacy';
import { QuickCreateRecordModal } from './QuickCreateRecordModal';

interface SearchableRelationshipSelectorProps {
  label: string;
  targetInventoryType: InventoryType;
  availableItems: PrivacyRecord[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  helperText?: string;
}

export const SearchableRelationshipSelector: React.FC<SearchableRelationshipSelectorProps> = ({
  label,
  targetInventoryType,
  availableItems,
  selectedIds,
  onChange,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const getInventoryIcon = (type: InventoryType) => {
    switch (type) {
      case 'processingActivities':
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'tspReferences':
        return <Cpu className="w-3.5 h-3.5 text-blue-600" />;
      case 'assets':
        return <Server className="w-3.5 h-3.5 text-emerald-600" />;
      case 'vendors':
        return <Building2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'entities':
        return <Globe2 className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Database className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getInventoryTitle = (type: InventoryType) => {
    switch (type) {
      case 'processingActivities':
        return 'Processing Activity';
      case 'tspReferences':
        return 'TSP / Product Ref';
      case 'assets':
        return 'Asset';
      case 'vendors':
        return 'Vendor';
      case 'entities':
        return 'Legal Entity';
      default:
        return 'Record';
    }
  };

  const filteredItems = availableItems.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const selectedRecords = availableItems.filter(item => selectedIds.includes(item.id));

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreatedNew = (newId: string) => {
    if (!selectedIds.includes(newId)) {
      onChange([...selectedIds, newId]);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className="text-xs text-slate-500 font-medium">
          {selectedIds.length} Linked
        </span>
      </div>

      {/* Selected Items Chips */}
      <div className="p-2 border border-slate-300 rounded-md bg-slate-50/50 min-h-[42px] mb-2 flex flex-wrap gap-1.5 items-center">
        {selectedRecords.length === 0 ? (
          <span className="text-xs text-slate-400 font-normal px-1">
            No {getInventoryTitle(targetInventoryType)} linked yet
          </span>
        ) : (
          selectedRecords.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs text-xs font-medium text-slate-800"
            >
              {getInventoryIcon(targetInventoryType)}
              <span className="font-mono text-[11px] font-semibold text-slate-500">{item.id}</span>
              <span className="max-w-[180px] truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => toggleSelect(item.id)}
                className="text-slate-400 hover:text-rose-600 transition ml-0.5"
                title="Remove Relationship"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsQuickCreateOpen(true)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition border border-slate-300"
            title={`Create a new ${getInventoryTitle(targetInventoryType)} record without leaving current form`}
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            + New {getInventoryTitle(targetInventoryType)}
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {isOpen ? 'Close' : 'Link / Manage'}
          </button>
        </div>
      </div>

      {/* Search & Selection Dropdown Box */}
      {isOpen && (
        <div className="p-3 border border-slate-300 rounded-lg bg-white shadow-lg mb-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${availableItems.length} available ${getInventoryTitle(targetInventoryType)}s...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold hover:bg-indigo-100 transition shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Create New
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-slate-400">No matching records found.</p>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(true)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create "{searchQuery || getInventoryTitle(targetInventoryType)}"
                </button>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between transition text-xs ${
                      isSelected ? 'bg-indigo-50/70 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      {getInventoryIcon(targetInventoryType)}
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">{item.id}</span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                        {item.status}
                      </span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      {/* Quick Create Inline Modal */}
      <QuickCreateRecordModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        targetInventoryType={targetInventoryType}
        onCreated={handleCreatedNew}
      />
    </div>
  );
};
