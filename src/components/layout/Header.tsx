import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  RotateCcw,
  FileText,
  Cpu,
  Server,
  Building2,
  Globe2,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { InventoryType } from '../../types/privacy';

interface HeaderProps {
  onOpenCreateModal: (inventoryType: InventoryType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal }) => {
  const {
    activeNav,
    globalSearchQuery,
    setGlobalSearchQuery,
    exportDataJSON,
    importDataJSON,
    resetToDefaultData,
    processingActivities,
    assets,
    vendors,
    entities,
    tspReferences,
    setSelectedRecord,
  } = usePrivacyData();

  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside listener for search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = globalSearchQuery.trim().toLowerCase();

  const matchedActivities = query
    ? processingActivities.filter(
        pa =>
          pa.id.toLowerCase().includes(query) ||
          pa.name.toLowerCase().includes(query) ||
          (pa.owner && pa.owner.toLowerCase().includes(query)) ||
          (pa.purpose && pa.purpose.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedAssets = query
    ? assets.filter(
        a =>
          a.id.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          (a.owner && a.owner.toLowerCase().includes(query)) ||
          (a.assetType && a.assetType.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedVendors = query
    ? vendors.filter(
        v =>
          v.id.toLowerCase().includes(query) ||
          v.name.toLowerCase().includes(query) ||
          (v.contactEmail && v.contactEmail.toLowerCase().includes(query)) ||
          (v.headquarters && v.headquarters.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedEntities = query
    ? entities.filter(
        e =>
          e.id.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query) ||
          (e.jurisdiction && e.jurisdiction.toLowerCase().includes(query)) ||
          (e.dpoContact && e.dpoContact.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedTSPs = query
    ? tspReferences.filter(
        t =>
          t.id.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          (t.businessProcessOwner && t.businessProcessOwner.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const hasMatches =
    matchedActivities.length > 0 ||
    matchedAssets.length > 0 ||
    matchedVendors.length > 0 ||
    matchedEntities.length > 0 ||
    matchedTSPs.length > 0;

  const getBreadcrumbTitle = () => {
    switch (activeNav) {
      case 'dashboard':
        return 'Data Mapping Dashboard';
      case 'processingActivities':
        return 'Data Mapping / Processing Activities Inventory';
      case 'tspReferences':
        return 'Data Mapping / TSP & Product References';
      case 'assets':
        return 'Data Mapping / Systems & Assets Inventory';
      case 'vendors':
        return 'Data Mapping / Vendors & Processors';
      case 'entities':
        return 'Data Mapping / Legal Entities Inventory';
      case 'future-assessments':
        return 'Assessments & DPIAs Module';
      case 'future-risks':
        return 'Risk Management Module';
      case 'future-incidents':
        return 'Privacy Incidents Module';
      case 'future-dsars':
        return 'Data Subject Requests (DSAR) Module';
      case 'future-reports':
        return 'Privacy Reporting & Governance';
      default:
        return 'Data Mapping Module';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          const success = importDataJSON(content);
          if (success) {
            setImportSuccessMsg(true);
            setTimeout(() => setImportSuccessMsg(false), 3000);
          } else {
            alert('Failed to parse JSON file. Ensure it is a valid PrivaMap export format.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">{getBreadcrumbTitle()}</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Instance
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6" ref={searchContainerRef}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, assets, vendors, entities by name, ID, or owner..."
            value={globalSearchQuery}
            onChange={e => {
              setGlobalSearchQuery(e.target.value);
              setSearchDropdownOpen(true);
            }}
            onFocus={() => setSearchDropdownOpen(true)}
            className="w-full pl-9 pr-12 py-1.5 text-xs rounded-md border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition placeholder:text-slate-400"
          />
          {globalSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setGlobalSearchQuery('');
                setSearchDropdownOpen(false);
              }}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          )}

          {/* Real-time search results dropdown */}
          {searchDropdownOpen && query && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {!hasMatches ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No matching records found for "<span className="font-semibold text-slate-800">{globalSearchQuery}</span>"
                </div>
              ) : (
                <>
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Instant Search Results
                  </div>

                  {/* Processing Activities */}
                  {matchedActivities.length > 0 && (
                    <div className="p-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Processing Activities ({matchedActivities.length})
                      </div>
                      {matchedActivities.map(pa => (
                        <button
                          key={pa.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecord({ id: pa.id, type: 'processingActivities' });
                            setGlobalSearchQuery('');
                            setSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-50 hover:text-indigo-900 text-xs flex items-center justify-between font-medium group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded group-hover:bg-indigo-100 group-hover:text-indigo-800 transition">
                              {pa.id}
                            </span>
                            <span className="text-slate-700 truncate font-semibold group-hover:text-indigo-950">{pa.name}</span>
                          </div>
                          {pa.owner && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">{pa.owner}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assets */}
                  {matchedAssets.length > 0 && (
                    <div className="p-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                        Systems & Assets ({matchedAssets.length})
                      </div>
                      {matchedAssets.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecord({ id: a.id, type: 'assets' });
                            setGlobalSearchQuery('');
                            setSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-emerald-50 hover:text-emerald-900 text-xs flex items-center justify-between font-medium group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Server className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                              {a.id}
                            </span>
                            <span className="text-slate-700 truncate font-semibold group-hover:text-emerald-950">{a.name}</span>
                          </div>
                          {a.assetType && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">{a.assetType}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Vendors */}
                  {matchedVendors.length > 0 && (
                    <div className="p-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                        Vendors & Processors ({matchedVendors.length})
                      </div>
                      {matchedVendors.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecord({ id: v.id, type: 'vendors' });
                            setGlobalSearchQuery('');
                            setSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 hover:text-amber-900 text-xs flex items-center justify-between font-medium group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                              {v.id}
                            </span>
                            <span className="text-slate-700 truncate font-semibold group-hover:text-amber-950">{v.name}</span>
                          </div>
                          {v.headquarters && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">{v.headquarters}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Entities */}
                  {matchedEntities.length > 0 && (
                    <div className="p-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-purple-600 uppercase tracking-wide">
                        Legal Entities ({matchedEntities.length})
                      </div>
                      {matchedEntities.map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecord({ id: e.id, type: 'entities' });
                            setGlobalSearchQuery('');
                            setSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-purple-50 hover:text-purple-900 text-xs flex items-center justify-between font-medium group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Globe2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded group-hover:bg-purple-100 group-hover:text-purple-800 transition">
                              {e.id}
                            </span>
                            <span className="text-slate-700 truncate font-semibold group-hover:text-purple-950">{e.name}</span>
                          </div>
                          {e.jurisdiction && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">{e.jurisdiction}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* TSPs */}
                  {matchedTSPs.length > 0 && (
                    <div className="p-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                        TSP / Product References ({matchedTSPs.length})
                      </div>
                      {matchedTSPs.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecord({ id: t.id, type: 'tspReferences' });
                            setGlobalSearchQuery('');
                            setSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 hover:text-blue-900 text-xs flex items-center justify-between font-medium group transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded group-hover:bg-blue-100 group-hover:text-blue-800 transition">
                              {t.id}
                            </span>
                            <span className="text-slate-700 truncate font-semibold group-hover:text-blue-950">{t.name}</span>
                          </div>
                          {t.businessProcessOwner && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">{t.businessProcessOwner}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Reset Confirmation Button */}
        {resetConfirmOpen ? (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-md">
            <span className="text-[11px] text-rose-800 font-semibold px-1">Reset seed data?</span>
            <button
              type="button"
              onClick={() => {
                resetToDefaultData();
                setResetConfirmOpen(false);
              }}
              className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-medium hover:bg-rose-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(false)}
              className="text-xs px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            title="Reset to default initial seed dataset"
            onClick={() => setResetConfirmOpen(true)}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Export JSON */}
        <button
          type="button"
          onClick={exportDataJSON}
          title="Export Data Mapping inventory as JSON"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export JSON
        </button>

        {/* Import JSON */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Import PrivaMap JSON file"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          Import
        </button>

        {importSuccessMsg && (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Imported!
          </span>
        )}

        {/* Create Record Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Record</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {createDropdownOpen && (
            <div
              className="absolute right-0 mt-1 w-56 rounded-md bg-white border border-slate-200 shadow-xl py-1 z-30 divide-y divide-slate-100"
              onMouseLeave={() => setCreateDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Data Mapping Inventories
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    onOpenCreateModal('processingActivities');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Processing Activity
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    onOpenCreateModal('tspReferences');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Cpu className="w-4 h-4 text-blue-600" />
                  TSP / Product Reference
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    onOpenCreateModal('assets');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Server className="w-4 h-4 text-emerald-600" />
                  Asset / System
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    onOpenCreateModal('vendors');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Vendor / Processor
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    onOpenCreateModal('entities');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Globe2 className="w-4 h-4 text-purple-600" />
                  Legal Entity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
