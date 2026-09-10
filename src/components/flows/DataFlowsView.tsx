import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  X,
  Server,
  Building2,
  Globe,
  Cpu,
  MapPin,
  HelpCircle,
  FileText,
  RefreshCw,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { DataFlowDiagram } from '../common/DataFlowDiagram';

export const DataFlowsView: React.FC = () => {
  const {
    processingActivities,
    assets,
    vendors,
    entities,
    setSelectedRecord,
  } = usePrivacyData();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Extract all unique hosting locations for filter dropdown
  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    assets.forEach(a => {
      if (a.primaryHostingLocation) locs.add(a.primaryHostingLocation);
      if (a.hostingLocation) locs.add(a.hostingLocation);
      if (a.additionalHostingLocations) {
        a.additionalHostingLocations.forEach(l => locs.add(l));
      }
    });
    return Array.from(locs).sort();
  }, [assets]);

  // Filter Processing Activities based on active selections
  const filteredActivities = useMemo(() => {
    return processingActivities.filter(pa => {
      // 1. Text Search Filter (Activity Name, Description, ID)
      const matchesSearch =
        searchQuery === '' ||
        pa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pa.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pa.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Asset Filter (Checks general, source, or destination assets)
      const matchesAsset =
        selectedAssetId === '' ||
        (pa.assetIds || []).includes(selectedAssetId) ||
        (pa.dataSourceAssetIds || []).includes(selectedAssetId) ||
        (pa.dataDestinationAssetIds || []).includes(selectedAssetId);

      if (!matchesAsset) return false;

      // 3. Vendor Filter
      const matchesVendor =
        selectedVendorId === '' ||
        (pa.vendorIds || []).includes(selectedVendorId);

      if (!matchesVendor) return false;

      // 4. Entity Filter
      const matchesEntity =
        selectedEntityId === '' ||
        (pa.entityIds || []).includes(selectedEntityId);

      if (!matchesEntity) return false;

      // 5. Location Filter (Check location of any linked asset)
      let matchesLocation = selectedLocation === '';
      if (selectedLocation !== '') {
        const linkedAssets = assets.filter(
          a =>
            (pa.assetIds || []).includes(a.id) ||
            (pa.dataSourceAssetIds || []).includes(a.id) ||
            (pa.dataDestinationAssetIds || []).includes(a.id)
        );
        matchesLocation = linkedAssets.some(
          a =>
            a.primaryHostingLocation === selectedLocation ||
            a.hostingLocation === selectedLocation ||
            (a.additionalHostingLocations || []).includes(selectedLocation)
        );
      }

      return matchesLocation;
    });
  }, [
    processingActivities,
    assets,
    searchQuery,
    selectedAssetId,
    selectedVendorId,
    selectedEntityId,
    selectedLocation,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAssetId('');
    setSelectedVendorId('');
    setSelectedEntityId('');
    setSelectedLocation('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Interactive Data Flows</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Visualize end-to-end data processing pipelines derived dynamically from your inventory relationships. 
            Identify originating data sources, central activities, downstream storage, and hosting jurisdictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 font-mono text-[11px] font-bold rounded-full border border-slate-200">
            {filteredActivities.length} Pipeline(s)
          </span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            Search & Filter Framework
          </span>
          {(searchQuery || selectedAssetId || selectedVendorId || selectedEntityId || selectedLocation) && (
            <button
              onClick={handleResetFilters}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search activity name/ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-slate-800"
            />
          </div>

          {/* Asset Select */}
          <div>
            <select
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/60 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-slate-700"
            >
              <option value="">Filter by Asset / System...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Select */}
          <div>
            <select
              value={selectedVendorId}
              onChange={e => setSelectedVendorId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/60 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-slate-700"
            >
              <option value="">Filter by Vendor...</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Select */}
          <div>
            <select
              value={selectedEntityId}
              onChange={e => setSelectedEntityId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/60 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-slate-700"
            >
              <option value="">Filter by Legal Entity...</option>
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>
                  {ent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Select */}
          <div>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/60 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-slate-700"
            >
              <option value="">Filter by Hosting Location...</option>
              {allLocations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MATCHED FLOWS LISTING */}
      <div className="space-y-6">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4 shadow-3xs max-w-2xl mx-auto">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">No matching pipelines identified</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No processing activities match your search and filter options. Try adjusting filters or reset the filter framework.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-slate-200 shadow-3xs p-5 hover:border-indigo-300 transition duration-150 space-y-4"
            >
              {/* Pipeline Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-150">
                        {activity.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Role: <span className="text-slate-700">{activity.role}</span>
                      </span>
                    </div>
                    <h3
                      onClick={() => setSelectedRecord({ id: activity.id, type: 'processingActivities' })}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer mt-1 truncate"
                    >
                      {activity.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecord({ id: activity.id, type: 'processingActivities' })}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg bg-slate-50 hover:bg-slate-100 transition flex items-center gap-1.5"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Data Flow Diagram Card */}
              <DataFlowDiagram processingActivityId={activity.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
