import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Cpu,
  Server,
  Building2,
  Globe2,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  UserCheck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, metrics } = usePrivacyData();
  const [dataMappingOpen, setDataMappingOpen] = useState(true);
  const [futureModulesOpen, setFutureModulesOpen] = useState(true);

  const navItemsDataMapping = [
    {
      id: 'processingActivities',
      label: 'Processing Activities',
      icon: FileText,
      count: metrics.totalProcessingActivities,
      accent: 'text-indigo-600',
    },
    {
      id: 'tspReferences',
      label: 'TSP / Product Ref',
      icon: Cpu,
      count: metrics.totalTSPs,
      accent: 'text-blue-600',
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Server,
      count: metrics.totalAssets,
      accent: 'text-emerald-600',
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Building2,
      count: metrics.totalVendors,
      accent: 'text-amber-600',
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: Globe2,
      count: metrics.totalEntities,
      accent: 'text-purple-600',
    },
    {
      id: 'dataFlows',
      label: 'Data Flows',
      icon: Layers,
      accent: 'text-indigo-500',
    },
  ];

  const futureModules = [
    { id: 'future-assessments', label: 'Assessments / DPIAs', icon: FileCheck },
    { id: 'future-risks', label: 'Risk Management', icon: ShieldAlert },
    { id: 'future-incidents', label: 'Privacy Incidents', icon: AlertTriangle },
    { id: 'future-dsars', label: 'Data Subject Requests', icon: UserCheck },
    { id: 'future-reports', label: 'Reporting & Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Platform Branding */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">PrivaMap</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Enterprise Privacy</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
          v2.4
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Core Dashboard Nav */}
        <div>
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition ${
              activeNav === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>dasshbaord</span>
            {metrics.attentionItemsCount > 0 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                {metrics.attentionItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Data Mapping Inventories Section */}
        <div>
          <button
            type="button"
            onClick={() => setDataMappingOpen(!dataMappingOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2 hover:text-slate-200 transition"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Data Mapping
            </span>
            {dataMappingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {dataMappingOpen && (
            <div className="space-y-0.5 pl-1">
              {navItemsDataMapping.map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.accent}`} />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Future Modules Section (Disabled / Coming Soon) */}
        <div>
          <button
            type="button"
            onClick={() => setFutureModulesOpen(!futureModulesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2 hover:text-slate-200 transition"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Future Modules
            </span>
            {futureModulesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {futureModulesOpen && (
            <div className="space-y-0.5 pl-1">
              {futureModules.map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 ${
                      isActive ? 'bg-slate-800/80 text-amber-300 border-l-2 border-amber-400 pl-2' : ''
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Soon
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
            PA
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">Privacy Officer</p>
            <p className="text-[10px] text-slate-400 truncate">privacy.admin@privacorp.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
