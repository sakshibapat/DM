import React from 'react';
import {
  Server,
  FileText,
  Cpu,
  Building2,
  Globe,
  ArrowRight,
  Database,
  Layers,
  MapPin,
  ExternalLink,
  HelpCircle,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { ProcessingActivity, Asset, Vendor, Entity, TSPReference } from '../../types/privacy';

interface DataFlowDiagramProps {
  processingActivityId: string;
}

export const DataFlowDiagram: React.FC<DataFlowDiagramProps> = ({ processingActivityId }) => {
  const {
    processingActivities,
    assets,
    vendors,
    entities,
    tspReferences,
    setSelectedRecord,
  } = usePrivacyData();

  const pa = processingActivities.find(p => p.id === processingActivityId);

  if (!pa) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Processing Activity not found</p>
      </div>
    );
  }

  // Resolve related records specifically for the flow
  const sourceAssets = assets.filter(a => (pa.dataSourceAssetIds || []).includes(a.id));
  const destinationAssets = assets.filter(a => (pa.dataDestinationAssetIds || []).includes(a.id));
  
  // General assets are those linked to assetIds but NOT already classified as sources or destinations
  const generalAssets = assets.filter(
    a => (pa.assetIds || []).includes(a.id) && 
         !(pa.dataSourceAssetIds || []).includes(a.id) && 
         !(pa.dataDestinationAssetIds || []).includes(a.id)
  );

  const linkedTsp = tspReferences.filter(t => (pa.tspIds || []).includes(t.id));
  const linkedVendors = vendors.filter(v => (pa.vendorIds || []).includes(v.id));
  const linkedEntities = entities.filter(e => (pa.entityIds || []).includes(e.id));

  // Extract hosting locations from all connected assets
  const hostingLocations = Array.from(
    new Set(
      [
        ...sourceAssets.map(a => a.primaryHostingLocation),
        ...destinationAssets.map(a => a.primaryHostingLocation),
        ...generalAssets.map(a => a.primaryHostingLocation),
      ].filter(Boolean) as string[]
    )
  );

  const hasAnyRelationships =
    sourceAssets.length > 0 ||
    destinationAssets.length > 0 ||
    generalAssets.length > 0 ||
    linkedTsp.length > 0 ||
    linkedVendors.length > 0 ||
    linkedEntities.length > 0 ||
    hostingLocations.length > 0;

  if (!hasAnyRelationships) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <Layers className="w-10 h-10 text-indigo-500 mx-auto mb-3 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-900 mb-1">No Data Flow Connections Defined</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          To generate an interactive lineage map, edit this processing activity and link data sources, data destinations, general assets, vendors, or entities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Data Sources</span>
          <span className="text-sm font-bold text-slate-800 font-mono">{sourceAssets.length}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Data Destinations</span>
          <span className="text-sm font-bold text-slate-800 font-mono">{destinationAssets.length}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Linked Vendors</span>
          <span className="text-sm font-bold text-slate-800 font-mono">{linkedVendors.length}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Hosting Regions</span>
          <span className="text-sm font-bold text-slate-800 font-mono">{hostingLocations.length}</span>
        </div>
      </div>

      {/* Modern Flow Visualisation Grid */}
      <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-hidden">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

        {/* COLUMN 1: DATA SOURCES */}
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
          <div className="text-center md:text-left">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold uppercase tracking-wider text-[9px]">
              1. Data Sources
            </span>
          </div>
          <div className="space-y-2">
            {sourceAssets.length === 0 ? (
              <div className="p-3.5 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                <span className="text-[11px] text-slate-400 italic">No explicit data sources</span>
              </div>
            ) : (
              sourceAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedRecord({ id: asset.id, type: 'assets' })}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 text-[11px] block truncate group-hover:text-blue-600 transition">
                        {asset.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                        {asset.id} • {asset.assetType}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition shrink-0 ml-1" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* VERTICAL OR HORIZONTAL DIVIDER/CONNECTOR FOR COLUMN 1 */}
        <div className="flex items-center justify-center z-10 shrink-0">
          <div className="flex md:flex-col items-center gap-1 text-slate-400">
            <div className="h-px w-6 md:w-px md:h-10 bg-slate-300" />
            <ArrowRight className="w-4 h-4 text-indigo-500 rotate-90 md:rotate-0" />
            <div className="h-px w-6 md:w-px md:h-10 bg-slate-300" />
          </div>
        </div>

        {/* COLUMN 2: PROCESSING ACTIVITY */}
        <div className="flex-1.2 flex flex-col justify-center space-y-3 z-10">
          <div className="text-center">
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase tracking-wider text-[9px]">
              2. Processing Activity
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-md space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div>
              <span className="text-[9px] font-mono text-indigo-600 font-bold tracking-wider uppercase block">
                {pa.id} • {pa.status}
              </span>
              <h4 className="font-bold text-slate-900 text-xs leading-snug mt-0.5">
                {pa.name}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Role</span>
                <span className="font-semibold text-slate-700 block flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-500" />
                  {pa.role}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Legal Basis</span>
                <span className="font-semibold text-slate-700 block flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {pa.legalBasis || 'Not Specified'}
                </span>
              </div>
            </div>

            {pa.description && (
              <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                {pa.description}
              </p>
            )}
          </div>
        </div>

        {/* VERTICAL OR HORIZONTAL DIVIDER/CONNECTOR FOR COLUMN 2 */}
        <div className="flex items-center justify-center z-10 shrink-0">
          <div className="flex md:flex-col items-center gap-1 text-slate-400">
            <div className="h-px w-6 md:w-px md:h-10 bg-slate-300" />
            <ArrowRight className="w-4 h-4 text-emerald-500 rotate-90 md:rotate-0" />
            <div className="h-px w-6 md:w-px md:h-10 bg-slate-300" />
          </div>
        </div>

        {/* COLUMN 3: DATA DESTINATIONS */}
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
          <div className="text-center md:text-right">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider text-[9px]">
              3. Data Destinations
            </span>
          </div>
          <div className="space-y-2">
            {destinationAssets.length === 0 ? (
              <div className="p-3.5 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                <span className="text-[11px] text-slate-400 italic">No explicit data destinations</span>
              </div>
            ) : (
              destinationAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedRecord({ id: asset.id, type: 'assets' })}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 text-[11px] block truncate group-hover:text-emerald-600 transition">
                        {asset.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                        {asset.id} • {asset.primaryHostingLocation || 'Unknown Region'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition shrink-0 ml-1" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION: INFRASTRUCTURE, VENDORS, CORPORATE ENTITIES & HOSTING LOCATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {/* SUBSECTION: HOSTING LOCATIONS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Hosting Locations & Regions
          </h4>
          <div className="space-y-1.5">
            {hostingLocations.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No locations derived</p>
            ) : (
              hostingLocations.map(loc => (
                <div key={loc} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700">{loc}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SUBSECTION: CONNECTED VENDORS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Related Vendors & Processors
          </h4>
          <div className="space-y-1.5">
            {linkedVendors.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No linked vendors</p>
            ) : (
              linkedVendors.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedRecord({ id: v.id, type: 'vendors' })}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 hover:border-amber-300 transition cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-amber-600 transition">
                    {v.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-500 transition shrink-0 ml-1" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* SUBSECTION: TSP PRODUCT REFS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            TSP / Product References
          </h4>
          <div className="space-y-1.5">
            {linkedTsp.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No linked TSP products</p>
            ) : (
              linkedTsp.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedRecord({ id: t.id, type: 'tspReferences' })}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 hover:border-blue-300 transition cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-blue-600 transition">
                    {t.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* SUBSECTION: LEGAL ENTITIES */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            Responsible Corporate Entities
          </h4>
          <div className="space-y-1.5">
            {linkedEntities.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No linked entities</p>
            ) : (
              linkedEntities.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedRecord({ id: e.id, type: 'entities' })}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 hover:border-purple-300 transition cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-purple-600 transition">
                    {e.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-500 transition shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
