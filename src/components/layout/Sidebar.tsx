import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Cpu,
  Server,
  Building2,
  Globe2,
  FileCheck,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Settings,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, metrics, privacyAssessments } = usePrivacyData();
  const [dataMappingOpen, setDataMappingOpen] = useState(true);

  const navItemsDataMapping = [
    {
      id: 'processingActivities',
      label: 'Processing Activities',
      icon: FileText,
      accent: 'text-indigo-600',
    },
    {
      id: 'tspReferences',
      label: 'TSP / Product Ref',
      icon: Cpu,
      accent: 'text-blue-600',
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Server,
      accent: 'text-emerald-600',
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Building2,
      accent: 'text-amber-600',
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: Globe2,
      accent: 'text-purple-600',
    },
  ];

  return (
    <aside className="w-80 bg-[#051329] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Platform Branding */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">PrivaMap</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Enterprise Privacy</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
          v2.4
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Core Dashboard Nav */}
        <div className="overflow-visible">
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold transition ${
              activeNav === 'dashboard'
                ? 'bg-[#c8102e] text-[#ffffff] shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
            {metrics.attentionItemsCount > 0 && (
              <span className="relative z-50 ml-auto group/attention">
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {metrics.attentionItemsCount}
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-full top-1/2 z-50 mr-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-500 ease-in-out group-hover/attention:opacity-100"
                >
                  {metrics.attentionItemsCount} compliance flags.
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Data Mapping Inventories Section */}
        <div>
          <button
            type="button"
            onClick={() => setDataMappingOpen(!dataMappingOpen)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 hover:text-slate-200 transition"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Data Mapping
            </span>
            {dataMappingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {dataMappingOpen && (
            <div className="space-y-1 pl-1">
              {navItemsDataMapping.map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition font-medium ${
                      isActive
                        ? 'bg-[#c8102e] text-[#ffffff] font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ffffff]' : item.accent}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="w-full flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
            <span className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              Privacy Assessments
            </span>
          </div>
          <div className="pl-1">
            <button
              type="button"
              onClick={() => setActiveNav('privacyAssessments')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition font-medium ${
                activeNav === 'privacyAssessments' || activeNav === 'future-assessments'
                  ? 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="truncate">Assessments</span>
              <span className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {privacyAssessments.length}
              </span>
            </button>
          </div>
        </div>

        <div>
          <div className="w-full flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              Article 30 Reporting
            </span>
          </div>
          <div className="pl-1">
            <button
              type="button"
              onClick={() => setActiveNav('ropa')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition font-medium ${
                activeNav === 'ropa'
                  ? 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="truncate">Record of Processing</span>
              <span className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {metrics.totalProcessingActivities}
              </span>
            </button>
          </div>
        </div>

        {/* Administration */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
            Administration
          </div>
          <button
            type="button"
            onClick={() => setActiveNav('inventory-manager')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition font-medium ${
              activeNav === 'inventory-manager'
                ? 'bg-[#c8102e] text-[#ffffff] font-semibold'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Inventory Manager</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer User Info */}
      <div className="px-4 py-3.5 border-t border-slate-800 bg-[#051329] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
            PA
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">Privacy Officer</p>
            <p className="text-xs text-slate-400 truncate">privacy.admin@privacorp.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
