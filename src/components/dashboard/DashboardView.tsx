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
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            View RoPA Register
          </button>
          <button
            type="button"
            onClick={() => onOpenCreateModal('processingActivities')}
            className="px-3.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-5 h-5" />
            New Activity
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Processing Activities */}
        <div
          onClick={() => setActiveNav('processingActivities')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-slate-500">
              Processing Activities
            </span>
            <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileText className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-slate-900">{metrics.totalProcessingActivities}</span>
            <span className="text-lg text-slate-500 font-medium">RoPA Records</span>
          </div>
          <p className="mt-4 text-base text-slate-600 leading-snug">{activityPreview}</p>
          <div className="mt-4 text-base text-indigo-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse inventory <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Assets */}
        <div
          onClick={() => setActiveNav('assets')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-slate-500">
              Total Assets
            </span>
            <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Server className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-slate-900">{metrics.totalAssets}</span>
            <span className="text-lg text-slate-500 font-medium">Databases & Apps</span>
          </div>
          <p className="mt-4 text-base text-slate-600 leading-snug">
            {sensitiveAssets} confidential or restricted · {applicationAssets}{' '}
            {applicationAssets === 1 ? 'application' : 'applications'}
          </p>
          <div className="mt-4 text-base text-emerald-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse assets <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Total Vendors */}
        <div
          onClick={() => setActiveNav('vendors')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-slate-500">
              Total Vendors
            </span>
            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-slate-900">{metrics.totalVendors}</span>
            <span className="text-lg text-slate-500 font-medium">Processors</span>
          </div>
          <p className="mt-4 text-base text-slate-600 leading-snug">
            {signedVendors} DPA signed · {openDpaVendors} in review or expired
          </p>
          <div className="mt-4 text-base text-amber-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse vendors <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Entities */}
        <div
          onClick={() => setActiveNav('entities')}
          className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-slate-500">
              Legal Entities
            </span>
            <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Globe2 className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-slate-900">{metrics.totalEntities}</span>
            <span className="text-lg text-slate-500 font-medium">Jurisdictions</span>
          </div>
          <p className="mt-4 text-base text-slate-600 leading-snug line-clamp-2">
            {jurisdictionPreview || 'No jurisdictions recorded'}
          </p>
          <div className="mt-4 text-base text-purple-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Browse entities <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 5: Records Missing Retention Info */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-amber-700">
              Missing Retention
            </span>
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-amber-900">{metrics.recordsMissingRetention}</span>
            <span className="text-lg text-amber-700 font-medium">Activities</span>
          </div>
          <p className="mt-4 text-base text-amber-800 leading-snug">
            {activitiesWithRetention} of {metrics.totalProcessingActivities} have a retention period
          </p>
          <p className="mt-3 text-base text-amber-600 font-medium">Requires retention policy</p>
        </div>

        {/* Metric 6: Records Involving High-Risk Personal Data */}
        <div className="min-h-[168px] p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="min-w-0 text-sm font-semibold uppercase tracking-wide leading-snug text-rose-700">
              High-Risk Data
            </span>
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-rose-950">{metrics.recordsHighRisk}</span>
            <span className="text-lg text-rose-700 font-medium">High Risk</span>
          </div>
          <p className="mt-4 text-base text-rose-800 leading-snug">
            {standardRiskActivities} {standardRiskActivities === 1 ? 'activity remains' : 'activities remain'} at standard risk
          </p>
          <p className="mt-3 text-base text-rose-600 font-medium">Requires DPIA assessment</p>
        </div>
      </div>
    </div>
  );
};
