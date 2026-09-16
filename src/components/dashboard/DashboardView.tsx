import React, { useState } from 'react';
import {
  FileText,
  Server,
  Building2,
  Globe2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  ChevronRight,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { StatusBadge, SeverityBadge } from '../common/Badge';
import { InventoryType } from '../../types/privacy';

interface DashboardViewProps {
  onOpenCreateModal: (inventoryType: InventoryType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreateModal }) => {
  const {
    metrics,
    attentionItems,
    auditLogs,
    setActiveNav,
    setSelectedRecord,
    globalSearchQuery,
  } = usePrivacyData();

  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [attentionSearch, setAttentionSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [attPage, setAttPage] = useState(1);
  const itemsPerPage = 6;

  const filteredAttentionItems = attentionItems.filter(item => {
    const matchesCategory = issueFilter === 'all' || item.issueType === issueFilter;
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    const matchesSearch =
      item.recordName.toLowerCase().includes(attentionSearch.toLowerCase()) ||
      item.recordId.toLowerCase().includes(attentionSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(attentionSearch.toLowerCase()) ||
      item.issueType.toLowerCase().includes(attentionSearch.toLowerCase());
    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const totalAttPages = Math.ceil(filteredAttentionItems.length / itemsPerPage);
  const paginatedAttentionItems = filteredAttentionItems.slice((attPage - 1) * itemsPerPage, attPage * itemsPerPage);

  const getInventoryTitle = (type: InventoryType) => {
    switch (type) {
      case 'processingActivities':
        return 'Processing Activity';
      case 'tspReferences':
        return 'TSP Reference';
      case 'assets':
        return 'Asset';
      case 'vendors':
        return 'Vendor';
      case 'entities':
        return 'Legal Entity';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Data Mapping & Governance Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Centralized register of data processing operations, systems, vendors, and legal entities. Monitor compliance posture and missing safeguards in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveNav('processingActivities')}
            className="px-3.5 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            View RoPA Register
          </button>
          <button
            type="button"
            onClick={() => onOpenCreateModal('processingActivities')}
            className="px-3.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Activity
          </button>
        </div>
      </div>

      {/* 8 Metric Cards Grid as specified in prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Processing Activities */}
        <div
          onClick={() => setActiveNav('processingActivities')}
          className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Processing Activities
            </span>
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalProcessingActivities}</span>
            <span className="text-xs text-slate-500 font-medium">RoPA Records</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse inventory <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2: Total Assets */}
        <div
          onClick={() => setActiveNav('assets')}
          className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalAssets}</span>
            <span className="text-xs text-slate-500 font-medium">Databases & Apps</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse assets <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Total Vendors */}
        <div
          onClick={() => setActiveNav('vendors')}
          className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Vendors
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalVendors}</span>
            <span className="text-xs text-slate-500 font-medium">Processors</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse vendors <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Total Entities */}
        <div
          onClick={() => setActiveNav('entities')}
          className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Legal Entities
            </span>
            <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalEntities}</span>
            <span className="text-xs text-slate-500 font-medium">Jurisdictions</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse entities <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 5: Controller Processing Activities */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Controller Activities
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.controllerActivitiesCount}</span>
            <span className="text-xs text-slate-500 font-medium">Primary Controller</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Determines purpose & means</p>
        </div>

        {/* Metric 6: Processor Processing Activities */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Processor Activities
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.processorActivitiesCount}</span>
            <span className="text-xs text-slate-500 font-medium">Sub-Processor Role</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Processes on client instructions</p>
        </div>

        {/* Metric 7: Records Missing Retention Info */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Missing Retention
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{metrics.recordsMissingRetention}</span>
            <span className="text-xs text-amber-700 font-medium">Activities</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 font-medium">Requires retention policy</p>
        </div>

        {/* Metric 8: Records Involving High-Risk Personal Data */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              High-Risk Data
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-950">{metrics.recordsHighRisk}</span>
            <span className="text-xs text-rose-700 font-medium">High Risk</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">Requires DPIA assessment</p>
        </div>
      </div>

      {/* Main Split Section: Records Requiring Attention & Recently Updated */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Records Requiring Attention Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Records Requiring Attention</h3>
                <p className="text-xs text-slate-500">Automated privacy quality & safeguard gap audit</p>
              </div>
            </div>

            {/* Filter Pill Options for the 8 Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => { setIssueFilter('all'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({attentionItems.length})
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('Missing retention'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'Missing retention'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Missing Retention
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('Missing legal basis'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'Missing legal basis'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Missing Legal Basis
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('LIA unconfirmed'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'LIA unconfirmed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                LIA Unconfirmed
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('International transfer without safeguard'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'International transfer without safeguard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Transfer Gaps
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('Missing Business Process Owner'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'Missing Business Process Owner'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Missing Owner
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('Missing TOM information'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'Missing TOM information'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Missing TOMs
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('TSP registration pending'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'TSP registration pending'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                TSP Pending
              </button>
              <button
                type="button"
                onClick={() => { setIssueFilter('Incomplete required fields'); setAttPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-md font-semibold transition shrink-0 ${
                  issueFilter === 'Incomplete required fields'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Incomplete Fields
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {/* Table Search & Severity Selector */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Filter table by record name, ID, issue..."
                  value={attentionSearch}
                  onChange={e => { setAttentionSearch(e.target.value); setAttPage(1); }}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-xs placeholder:text-slate-400 font-medium"
                />
                <select
                  value={severityFilter}
                  onChange={e => { setSeverityFilter(e.target.value); setAttPage(1); }}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none text-slate-700 font-medium"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High Severity Only</option>
                  <option value="medium">Medium Severity Only</option>
                  <option value="low">Low Severity Only</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 font-bold">
                Showing {filteredAttentionItems.length} issues
              </div>
            </div>

            {/* Records Requiring Attention Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider select-none">
                    <th className="p-3 pl-4">Record</th>
                    <th className="p-3">Issue Category</th>
                    <th className="p-3">Audit Findings / Action required</th>
                    <th className="p-3 text-center">Severity</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAttentionItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500 bg-white">
                        <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-800">Compliance Posture Complete</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No quality gaps found for active filters.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAttentionItems.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRecord({ id: item.recordId, type: item.inventoryType })}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="p-3 pl-4 max-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.recordId}
                            </span>
                            <span className="font-bold text-slate-900 truncate hover:text-indigo-600 transition" title={item.recordName}>
                              {item.recordName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                            {getInventoryTitle(item.inventoryType)}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                          {item.issueType}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={item.description}>
                          {item.description}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td className="p-3 text-right pr-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord({ id: item.recordId, type: item.inventoryType });
                            }}
                            className="px-2.5 py-1 text-[11px] rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalAttPages > 1 && (
              <div className="p-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-[11px] select-none">
                <button
                  type="button"
                  disabled={attPage === 1}
                  onClick={() => setAttPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-bold transition"
                >
                  Previous
                </button>
                <span className="text-slate-500 font-bold">
                  Page {attPage} of {totalAttPages}
                </span>
                <button
                  type="button"
                  disabled={attPage === totalAttPages}
                  onClick={() => setAttPage(prev => Math.min(totalAttPages, prev + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-bold transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recently Updated Records Audit Trail */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Updated Records</h3>
              <p className="text-xs text-slate-500">Audit trail across all inventories</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="text-xs space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{log.recordId}</span>
                  <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 truncate">{log.recordName}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{log.details}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {log.user}
                  </span>
                  <span className="font-medium text-slate-500 px-1.5 py-0.2 rounded bg-slate-100">
                    {log.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
