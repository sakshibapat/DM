import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  History,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { InventoryType } from '../../types/privacy';
import { InventoryOption } from '../../types/inventoryConfig';

const INVENTORY_ORDER: InventoryType[] = [
  'processingActivities',
  'tspReferences',
  'assets',
  'vendors',
  'entities',
];

const makeOptionId = (groupKey: string, value: string) =>
  `${groupKey}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;

export const InventoryManagerView: React.FC = () => {
  const {
    inventoryConfig,
    configurationAuditLog,
    updateOptionGroup,
    resetOptionGroup,
    resetInventoryConfiguration,
    isOptionValueInUse,
  } = usePrivacyData();
  const [inventoryType, setInventoryType] = useState<InventoryType>('processingActivities');
  const groups = inventoryConfig.inventories[inventoryType].optionGroups;
  const [groupKey, setGroupKey] = useState(Object.keys(groups)[0]);
  const [draftOptions, setDraftOptions] = useState<InventoryOption[]>(groups[groupKey].options);
  const [newValue, setNewValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const activeGroup = groups[groupKey] || Object.values(groups)[0];

  useEffect(() => {
    const firstKey = Object.keys(inventoryConfig.inventories[inventoryType].optionGroups)[0];
    setGroupKey(firstKey);
  }, [inventoryType, inventoryConfig.inventories]);

  useEffect(() => {
    if (!activeGroup) return;
    setDraftOptions(activeGroup.options.map(option => ({ ...option })));
    setIsDirty(false);
    setNewValue('');
  }, [activeGroup]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const recentAudit = useMemo(
    () => configurationAuditLog.filter(entry => entry.inventoryType === inventoryType).slice(0, 8),
    [configurationAuditLog, inventoryType]
  );

  const changeSelection = (nextInventory: InventoryType, nextGroup?: string) => {
    if (isDirty && !window.confirm('Discard unsaved option changes?')) return;
    setInventoryType(nextInventory);
    if (nextGroup) setGroupKey(nextGroup);
  };

  const selectGroup = (nextGroup: string) => {
    if (nextGroup === groupKey) return;
    if (isDirty && !window.confirm('Discard unsaved option changes?')) return;
    setGroupKey(nextGroup);
  };

  const updateDraft = (next: InventoryOption[]) => {
    setDraftOptions(next);
    setIsDirty(true);
  };

  const addOption = () => {
    const value = newValue.trim();
    if (!value) return;
    if (draftOptions.some(option => option.value.toLowerCase() === value.toLowerCase())) {
      window.alert('That option already exists in this list.');
      return;
    }
    updateDraft([
      ...draftOptions,
      { id: makeOptionId(groupKey, value), value, label: value, enabled: true },
    ]);
    setNewValue('');
  };

  const renameOption = (id: string, value: string) => {
    const normalized = value.trimStart();
    updateDraft(
      draftOptions.map(option =>
        option.id === id ? { ...option, value: normalized, label: normalized } : option
      )
    );
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draftOptions.length) return;
    const next = [...draftOptions];
    [next[index], next[target]] = [next[target], next[index]];
    updateDraft(next);
  };

  const removeOption = (option: InventoryOption) => {
    if (isOptionValueInUse(inventoryType, option.value)) {
      if (
        window.confirm(
          `"${option.value}" is used by existing records and cannot be deleted safely. Disable it for new records instead?`
        )
      ) {
        updateDraft(
          draftOptions.map(item => (item.id === option.id ? { ...item, enabled: false } : item))
        );
      }
      return;
    }
    if (window.confirm(`Remove "${option.value}" from this option list?`)) {
      updateDraft(draftOptions.filter(item => item.id !== option.id));
    }
  };

  const save = () => {
    const normalized = draftOptions.map(option => ({
      ...option,
      value: option.value.trim(),
      label: option.value.trim(),
    }));
    if (normalized.some(option => !option.value)) {
      window.alert('Options cannot be empty.');
      return;
    }
    const seen = new Set<string>();
    if (
      normalized.some(option => {
        const key = option.value.toLowerCase();
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      })
    ) {
      window.alert('Option values must be unique.');
      return;
    }
    updateOptionGroup(inventoryType, groupKey, normalized);
    setIsDirty(false);
  };

  const restoreGroup = () => {
    if (!window.confirm(`Restore the default values for "${activeGroup.label}"?`)) return;
    resetOptionGroup(inventoryType, groupKey);
    setIsDirty(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c8102e]" />
            Inventory Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the controlled option lists used by existing inventory forms and filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Restore every inventory option list to its defaults?')) {
              resetInventoryConfiguration();
            }
          }}
          className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore All Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_250px_minmax(0,1fr)] gap-4">
        <section className="bg-white border border-slate-200 rounded-lg p-3 h-fit">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Inventories
          </h2>
          <div className="space-y-1">
            {INVENTORY_ORDER.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => changeSelection(type)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition ${
                  inventoryType === type
                    ? 'bg-[#c8102e] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {inventoryConfig.inventories[type].displayName}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-3 h-fit">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Option Groups
          </h2>
          <div className="space-y-1">
            {Object.keys(groups).map(key => {
              const optionGroup = groups[key];
              return (
              <button
                key={optionGroup.key}
                type="button"
                onClick={() => selectGroup(optionGroup.key)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition ${
                  groupKey === optionGroup.key
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {optionGroup.label}
                <span className="block text-[10px] opacity-70 mt-0.5">
                  {optionGroup.options.filter(option => option.enabled).length} enabled
                </span>
              </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-4 min-w-0">
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{activeGroup.label}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeGroup.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restoreGroup}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Restore Defaults
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!isDirty}
                  className="px-3 py-1.5 rounded-md bg-[#c8102e] text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-2">
              <input
                value={newValue}
                onChange={event => setNewValue(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Add a new option"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#c8102e]/20"
              />
              <button
                type="button"
                onClick={addOption}
                disabled={!newValue.trim()}
                className="px-3 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {draftOptions.map((option, index) => (
                <div key={option.id} className="p-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                    {index + 1}
                  </span>
                  <input
                    value={option.value}
                    onChange={event => renameOption(option.id, event.target.value)}
                    className={`min-w-0 flex-1 px-2.5 py-1.5 text-sm border rounded-md ${
                      option.enabled
                        ? 'border-slate-300 text-slate-900'
                        : 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft(
                        draftOptions.map(item =>
                          item.id === option.id ? { ...item, enabled: !item.enabled } : item
                        )
                      )
                    }
                    className={`px-2 py-1.5 rounded text-[10px] font-bold ${
                      option.enabled
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {option.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button type="button" onClick={() => moveOption(index, -1)} disabled={index === 0} className="p-1.5 text-slate-500 disabled:opacity-25">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveOption(index, 1)} disabled={index === draftOptions.length - 1} className="p-1.5 text-slate-500 disabled:opacity-25">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => removeOption(option)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Preview: {draftOptions.filter(option => option.enabled).map(option => option.value).join(' • ') || 'No enabled options'}
              </span>
              {isDirty && <span className="text-amber-700 font-semibold">Unsaved changes</span>}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-slate-500" />
              Configuration Audit
            </h2>
            {recentAudit.length === 0 ? (
              <p className="text-xs text-slate-400">No configuration changes recorded for this inventory.</p>
            ) : (
              <div className="space-y-2">
                {recentAudit.map(entry => (
                  <div key={entry.id} className="text-xs flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">
                        {entry.action} · {entry.optionGroupKey}
                      </span>
                      <span className="text-slate-500"> — {entry.details}</span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleString()} · {entry.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
