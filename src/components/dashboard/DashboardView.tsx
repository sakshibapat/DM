import React from 'react';
import {
  FileText,
  Server,
  Building2,
  Globe2,
  Plus,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { InventoryType } from '../../types/privacy';

interface DashboardViewProps {
  onOpenCreateModal: (inventoryType: InventoryType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreateModal }) => {
  const {
    metrics,
    setActiveNav,
    processingActivities,
    assets,
    vendors,
    entities,
  } = usePrivacyData();

  const approvedActivities = processingActivities.filter(activity => activity.status === 'Approved').length;
  const reviewActivities = processingActivities.filter(activity => activity.status === 'Under Review').length;
  const draftActivities = processingActivities.filter(activity => activity.status === 'Draft').length;
  const sensitiveAssets = assets.filter(
    asset => asset.dataClassification === 'Confidential' || asset.dataClassification === 'Restricted'
  ).length;
  const applicationAssets = assets.filter(asset => asset.assetType === 'Application').length;
  const signedVendors = vendors.filter(vendor => vendor.dpaStatus === 'Signed').length;
  const openDpaVendors = vendors.filter(
    vendor => vendor.dpaStatus === 'In Review' || vendor.dpaStatus === 'Expired'
  ).length;
  const jurisdictionPreview = [...new Set(entities.map(entity => entity.jurisdiction).filter(Boolean))]
    .slice(0, 2)
    .join(' · ');
  const activitiesWithRetention = metrics.totalProcessingActivities - metrics.recordsMissingRetention;
  const standardRiskActivities = metrics.totalProcessingActivities - metrics.recordsHighRisk;
  const activityPreview = [
    `${approvedActivities} approved`,
    `${reviewActivities} in review`,
    draftActivities > 0 ? `${draftActivities} draft` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Data Mapping & Governance Dashboard
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Processing Activities */}
        <div
          onClick={() => setActiveNav('processingActivities')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Processing Activities
            </span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.totalProcessingActivities}</span>
            <span className="text-sm text-slate-500 font-medium">RoPA Records</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">{activityPreview}</p>
          <div className="mt-3 text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse inventory <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 2: Total Assets */}
        <div
          onClick={() => setActiveNav('assets')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.totalAssets}</span>
            <span className="text-sm text-slate-500 font-medium">Databases & Apps</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            {sensitiveAssets} confidential or restricted · {applicationAssets}{' '}
            {applicationAssets === 1 ? 'application' : 'applications'}
          </p>
          <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse assets <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 3: Total Vendors */}
        <div
          onClick={() => setActiveNav('vendors')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Vendors
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.totalVendors}</span>
            <span className="text-sm text-slate-500 font-medium">Processors</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            {signedVendors} DPA signed · {openDpaVendors} in review or expired
          </p>
          <div className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse vendors <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 4: Total Entities */}
        <div
          onClick={() => setActiveNav('entities')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Legal Entities
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Globe2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.totalEntities}</span>
            <span className="text-sm text-slate-500 font-medium">Jurisdictions</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2">
            {jurisdictionPreview || 'No jurisdictions recorded'}
          </p>
          <div className="mt-3 text-xs text-purple-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse entities <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 5: Controller Processing Activities */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Controller Activities
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.controllerActivitiesCount}</span>
            <span className="text-sm text-slate-500 font-medium">Primary Controller</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            {metrics.jointControllerActivitiesCount === 0
              ? 'No joint-controller activities'
              : `${metrics.jointControllerActivitiesCount} joint-controller ${metrics.jointControllerActivitiesCount === 1 ? 'activity' : 'activities'}`}
          </p>
          <p className="mt-2 text-xs text-slate-400">Determines purpose & means</p>
        </div>

        {/* Metric 6: Processor Processing Activities */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Processor Activities
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{metrics.processorActivitiesCount}</span>
            <span className="text-sm text-slate-500 font-medium">Sub-Processor Role</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            {metrics.processorActivitiesCount} of {metrics.totalProcessingActivities} activities act for a client
          </p>
          <p className="mt-2 text-xs text-slate-400">Processes on client instructions</p>
        </div>

        {/* Metric 7: Records Missing Retention Info */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Missing Retention
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-900">{metrics.recordsMissingRetention}</span>
            <span className="text-sm text-amber-700 font-medium">Activities</span>
          </div>
          <p className="mt-3 text-xs text-amber-800 leading-relaxed">
            {activitiesWithRetention} of {metrics.totalProcessingActivities} have a retention period
          </p>
          <p className="mt-2 text-xs text-amber-600 font-medium">Requires retention policy</p>
        </div>

        {/* Metric 8: Records Involving High-Risk Personal Data */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              High-Risk Data
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-950">{metrics.recordsHighRisk}</span>
            <span className="text-sm text-rose-700 font-medium">High Risk</span>
          </div>
          <p className="mt-3 text-xs text-rose-800 leading-relaxed">
            {standardRiskActivities} {standardRiskActivities === 1 ? 'activity remains' : 'activities remain'} at standard risk
          </p>
          <p className="mt-2 text-xs text-rose-600 font-medium">Requires DPIA assessment</p>
        </div>
      </div>
    </div>
  );
};
