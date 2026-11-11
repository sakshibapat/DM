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
  Layers,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, metrics, privacyAssessments } = usePrivacyData();
  const [dataMappingOpen, setDataMappingOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const navItemsDataMapping = [
    {
      id: 'processingActivities',
      label: 'Processing Activities',
      icon: FileText,
      accent: 'text-indigo-600',
    },
    {
      id: 'tspReferences',
      label: 'TSP Products',
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
    <aside className={`${collapsed ? 'w-[4.75rem]' : 'w-[22rem]'} bg-[#051329] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none transition-[width] duration-200`}>
      {/* Platform Branding */}
      <div className={`${collapsed ? 'h-16 px-2 justify-center' : 'h-20 px-5 justify-between'} flex items-center border-b border-slate-800/80`}>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">Trimble Privacy Management Platform</h1>
          </div>
        )}
        <div className={collapsed ? 'flex items-center shrink-0' : 'flex flex-col items-end gap-1 shrink-0'}>
          <button
            type="button"
            onClick={() => setCollapsed(open => !open)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
          >
            {collapsed ? <PanelLeftOpen className="w-[30px] h-[30px]" /> : <PanelLeftClose className="w-6 h-6" />}
          </button>
          {!collapsed && (
            <span className="text-[13.5px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
              v2.4
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 ${collapsed ? 'px-2 py-[23px] space-y-[27.6px]' : 'px-4 py-5 space-y-6'}`}>
        {/* Core Dashboard Nav */}
        <div className="overflow-visible">
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center rounded-md text-[15.75px] font-semibold transition ${
              collapsed ? 'justify-center px-2 py-[11.5px]' : 'gap-3 px-3.5 py-2.5'
            } ${
              activeNav === 'dashboard'
                ? 'bg-[#c8102e] text-[#ffffff] shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className={`${collapsed ? 'w-[37.5px] h-[37.5px]' : 'w-[30px] h-[30px]'} shrink-0`} />
            {!collapsed && <span>Dashboard</span>}
            {!collapsed && metrics.attentionItemsCount > 0 && (
              <span className="relative z-50 ml-auto group/attention">
                <span className="text-[13.5px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {metrics.attentionItemsCount}
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-full top-1/2 z-50 mr-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[11.25px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-500 ease-in-out group-hover/attention:opacity-100"
                >
                  {metrics.attentionItemsCount} compliance flags.
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Data Mapping Inventories Section */}
        <div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setDataMappingOpen(!dataMappingOpen)}
              className="w-full flex items-center justify-between text-[13.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 hover:text-slate-200 transition"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-6 h-6 text-indigo-400" />
                Data Mapping
              </span>
              {dataMappingOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </button>
          )}

          {(collapsed || dataMappingOpen) && (
            <div className={collapsed ? 'space-y-[4.6px]' : 'space-y-1 pl-1'}>
              {navItemsDataMapping.map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    title={item.label}
                    className={`w-full flex items-center rounded-md text-[15.75px] transition font-medium ${
                      collapsed ? 'justify-center px-2 py-[11.5px]' : 'gap-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#c8102e] text-[#ffffff] font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`${collapsed ? 'w-[22.5px] h-[22.5px]' : 'w-[18px] h-[18px]'} shrink-0 ${isActive ? 'text-[#ffffff]' : item.accent}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {!collapsed && (
            <div className="w-full flex items-center text-[13.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              <span className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-indigo-400" />
                Privacy Assessments
              </span>
            </div>
          )}
          <div className={collapsed ? '' : 'pl-1'}>
            <button
              type="button"
              onClick={() => setActiveNav('privacyAssessments')}
              title="Assessments"
              className={`w-full flex items-center rounded-md text-[15.75px] transition font-medium ${
                collapsed ? 'justify-center px-2 py-[11.5px]' : 'gap-3 px-3 py-2'
              } ${
                activeNav === 'privacyAssessments' || activeNav === 'future-assessments'
                  ? collapsed
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <FileCheck className={`${collapsed ? 'w-[22.5px] h-[22.5px]' : 'w-[18px] h-[18px]'} shrink-0 text-indigo-400`} />
              {!collapsed && <span className="truncate">Assessments</span>}
              {!collapsed && (
                <span className="ml-auto text-[13.5px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {privacyAssessments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div>
          {!collapsed && (
            <div className="w-full flex items-center text-[13.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-indigo-400" />
                Article 30 Reporting
              </span>
            </div>
          )}
          <div className={collapsed ? '' : 'pl-1'}>
            <button
              type="button"
              onClick={() => setActiveNav('ropa')}
              title="Record of Processing"
              className={`w-full flex items-center rounded-md text-[15.75px] transition font-medium ${
                collapsed ? 'justify-center px-2 py-[11.5px]' : 'gap-3 px-3 py-2'
              } ${
                activeNav === 'ropa'
                  ? collapsed
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ClipboardList className={`${collapsed ? 'w-[22.5px] h-[22.5px]' : 'w-[18px] h-[18px]'} shrink-0 text-indigo-400`} />
              {!collapsed && <span className="truncate">Record of Processing</span>}
              {!collapsed && (
                <span className="ml-auto text-[13.5px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {metrics.totalProcessingActivities}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Administration */}
        <div>
          {!collapsed && (
            <div className="text-[13.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              Administration
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveNav('inventory-manager')}
            title="Inventory Manager"
            className={`w-full flex items-center rounded-md text-[15.75px] transition font-medium ${
              collapsed ? 'justify-center px-2 py-[11.5px]' : 'gap-3 px-3 py-2'
            } ${
              activeNav === 'inventory-manager'
                ? 'bg-[#c8102e] text-[#ffffff] font-semibold'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Settings className={`${collapsed ? 'w-[22.5px] h-[22.5px]' : 'w-[18px] h-[18px]'} shrink-0`} />
            {!collapsed && <span>Inventory Manager</span>}
          </button>
        </div>
      </div>

      {/* Sidebar Footer User Info */}
      {!collapsed && (
      <div className="px-4 py-3.5 border-t border-slate-800 bg-[#051329] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[15.75px] shrink-0">
            PA
          </div>
          <div className="truncate">
            <p className="text-[15.75px] font-semibold text-white truncate">Privacy Officer</p>
            <p className="text-[13.5px] text-slate-400 truncate">privacy.admin@privacorp.com</p>
          </div>
        </div>
      </div>
      )}
    </aside>
  );
};
