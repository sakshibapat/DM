import React, { useEffect, useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  User,
  Tag,
  FileText,
  Cpu,
  Server,
  Building2,
  Globe2,
  Lock,
  ArrowRight,
  Share2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { InventoryType, ProcessingActivity, TSPReference, Asset, Vendor, Entity, usesControllerWizardOptions } from '../../types/privacy';
import { StatusBadge, ClassificationBadge, DpaStatusBadge, TagChip } from '../common/Badge';
import { ActivityTransferChart } from './ActivityTransferChart';
import { destinationSafeguardLines, resolveTransferLinks } from '../../utils/destinationSafeguards';
import { RiskWarningBanner } from '../common/RiskWarningBanner';
import { getPersonalDataMetadata } from '../../data/personalDataCatalog';
import { getInternationalTransferWarning } from '../../data/recipientAndTransferCatalog';

interface RecordDetailDrawerProps {
  onEditRecord: (type: InventoryType, id: string) => void;
}

export const RecordDetailDrawer: React.FC<RecordDetailDrawerProps> = ({ onEditRecord }) => {
  const {
    selectedRecord,
    setSelectedRecord,
    processingActivities,
    tspReferences,
    assets,
    vendors,
    entities,
    deleteRecord,
  } = usePrivacyData();

  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'dataFlow' | 'flaggedRisks'>('overview');

  useEffect(() => {
    if (!selectedRecord) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedRecord(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRecord, setSelectedRecord]);

  // Always open the preview on the Overview tab for a newly selected record
  useEffect(() => {
    setActiveTab('overview');
  }, [selectedRecord?.id, selectedRecord?.type]);

  if (!selectedRecord) return null;

  const { id, type } = selectedRecord;

  // Retrieve current record
  let record: any = null;
  if (type === 'processingActivities') record = processingActivities.find(x => x.id === id);
  if (type === 'tspReferences') record = tspReferences.find(x => x.id === id);
  if (type === 'assets') record = assets.find(x => x.id === id);
  if (type === 'vendors') record = vendors.find(x => x.id === id);
  if (type === 'entities') record = entities.find(x => x.id === id);

  if (!record) return null;


  const getInventoryTitle = (invType: InventoryType) => {
    switch (invType) {
      case 'processingActivities':
        return 'Processing Activity';
      case 'tspReferences':
        return 'TSP Product';
      case 'assets':
        return 'Asset / System';
      case 'vendors':
        return 'Vendor / Processor';
      case 'entities':
        return 'Legal Entity';
    }
  };

  const getInventoryIcon = (invType: InventoryType) => {
    switch (invType) {
      case 'processingActivities':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'tspReferences':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'assets':
        return <Server className="w-4 h-4 text-emerald-600" />;
      case 'vendors':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'entities':
        return <Globe2 className="w-4 h-4 text-purple-600" />;
    }
  };

  // Identify Privacy Attention Gaps for this record
  const getRecordAttentionGaps = () => {
    const gaps: { title: string; desc: string; severity: 'high' | 'medium' }[] = [];
    if (type === 'processingActivities') {
      const pa = record as ProcessingActivity;
      if (usesControllerWizardOptions(pa.role)) {
        if (!pa.legalBasis) {
          gaps.push({ title: 'Missing Legal Basis', desc: 'Art. 6 GDPR legal basis unassigned.', severity: 'high' });
        } else if ((pa.legalBasis === 'Legitimate Interest of the Controller' || pa.legalBasis === 'Legitimate Interest') && !pa.liaFiled) {
          gaps.push({ title: 'LIA Unconfirmed Warning', desc: 'Legitimate Interest selected but LIA has not been confirmed.', severity: 'medium' });
        }
      }
      if (!pa.owner) {
        gaps.push({ title: 'Missing Record Owner', desc: 'No designated business lead.', severity: 'medium' });
      }
      if (!pa.toms || pa.toms.length === 0) {
        gaps.push({ title: 'Missing TOMs', desc: 'No security measures documented.', severity: 'high' });
      }
      if (pa.hasInternationalTransfer === 'Unknown') {
        gaps.push({ title: 'International Transfer Unconfirmed', desc: 'International transfer status requires review.', severity: 'medium' });
      } else if (pa.hasInternationalTransfer === 'Yes') {
        const transferWarn = getInternationalTransferWarning(pa);
        if (transferWarn) {
          gaps.push({
            title: transferWarn.title,
            desc: transferWarn.description,
            severity: transferWarn.severity === 'error' ? 'high' : 'medium',
          });
        }
      }
    } else if (type === 'assets') {
      const ast = record as Asset;
      if (!ast.owner) {
        gaps.push({ title: 'Missing Asset Owner', desc: 'No IT system custodian listed.', severity: 'medium' });
      }
    } else if (type === 'vendors') {
      const v = record as Vendor;
      if (v.dpaStatus !== 'Signed') {
        gaps.push({ title: `DPA Status '${v.dpaStatus}'`, desc: 'Data Processing Agreement pending execution.', severity: 'high' });
      }
    }
    return gaps;
  };

  const attentionGaps = getRecordAttentionGaps();

  // Step 8 "Related Inventories" links for processing activities (same lists as the wizard)
  const lookupLinked = (items: any[], ids: string[] = []) =>
    ids.map(linkedId => items.find((x: any) => x.id === linkedId)).filter(Boolean) as any[];
  const relatedSections: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    groups: { label: string | null; type: InventoryType; items: any[] }[];
  }[] = type === 'processingActivities' ? [
    {
      title: 'Linked TSP products',
      icon: Cpu,
      iconClass: 'text-blue-600',
      groups: [{ label: null, type: 'tspReferences', items: lookupLinked(tspReferences, record.tspIds) }],
    },
    {
      title: 'Assets',
      icon: Server,
      iconClass: 'text-emerald-600',
      groups: [
        { label: 'Source', type: 'assets', items: lookupLinked(assets, record.dataSourceAssetIds) },
        { label: 'Destinations', type: 'assets', items: lookupLinked(assets, record.dataDestinationAssetIds) },
      ],
    },
    {
      title: 'Vendors',
      icon: Building2,
      iconClass: 'text-amber-600',
      groups: [{ label: null, type: 'vendors', items: lookupLinked(vendors, record.vendorIds) }],
    },
    {
      title: 'Legal Entities',
      icon: Globe2,
      iconClass: 'text-purple-600',
      groups: [{ label: null, type: 'entities', items: lookupLinked(entities, record.entityIds) }],
    },
  ] : [];

  // Processing activity preview (Overview tab)
  const paRetentionType: string = record.retentionPolicyType || (record.hasRetentionPolicy === true ? 'Custom' : 'None');
  const paSubjectRows: { cat: string; items: string[] }[] = (record.dataSubjectCategories || []).map((cat: string) => ({
    cat,
    items: (record.dataSubjectPersonalDataMap?.[cat] || []) as string[],
  }));
  // Flagged Risks tab: restricted personal data categories (from step 3)
  const restrictedRows: { name: string; subjects: string[] }[] = type === 'processingActivities' ? (() => {
    const byName = new Map<string, string[]>();
    paSubjectRows.forEach(row => row.items.forEach(item => {
      if (getPersonalDataMetadata(item).classification !== 'Restricted') return;
      byName.set(item, [...(byName.get(item) || []), row.cat]);
    }));
    return Array.from(byName.entries()).map(([name, subjects]) => ({ name, subjects }));
  })() : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-2xs sm:p-8 animate-in fade-in duration-200"
      onClick={() => setSelectedRecord(null)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-preview-title"
        onClick={event => event.stopPropagation()}
        className="flex max-h-[min(90vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded bg-white border border-slate-200 shadow-2xs">
                {getInventoryIcon(type)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {record.id}
              </span>
              <StatusBadge status={record.status} />
              <span className="text-xs text-slate-500 font-medium">{getInventoryTitle(type)}</span>
            </div>
            <h2 id="record-preview-title" className="text-lg font-bold text-slate-900 leading-snug">{record.name}</h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          {type === 'processingActivities' && (
            <button
              type="button"
              onClick={() => setActiveTab('related')}
              className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'related'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Related Inventories
            </button>
          )}
          {type === 'processingActivities' && (
            <button
              type="button"
              onClick={() => setActiveTab('dataFlow')}
              className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'dataFlow'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Data Flow
            </button>
          )}
          {type === 'processingActivities' && (
            <button
              type="button"
              onClick={() => setActiveTab('flaggedRisks')}
              className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'flaggedRisks'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Flagged Risks
            </button>
          )}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Attention Warnings */}
          {attentionGaps.length > 0 && (
            <div className="space-y-2">
              {attentionGaps.map((gap, i) => (
                <RiskWarningBanner
                  key={i}
                  title={gap.title}
                  description={gap.desc}
                  severity={gap.severity}
                />
              ))}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs">
              {type === 'processingActivities' && (
                <>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                    {record.description && (
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Description</span>
                        <p className="text-slate-700 leading-relaxed">{record.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Processing role</span>
                        <span className="font-medium text-slate-800">{record.role || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Purpose for Processing</span>
                        <span className="font-medium text-slate-800">{record.purpose || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Legal Basis</span>
                        <span className="font-medium text-slate-800">{record.legalBasis || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Data Retention</span>
                        <span className="font-medium text-slate-800 block">{paRetentionType}</span>
                        {paRetentionType === 'Custom' && record.retentionPeriod ? (
                          <span className="text-slate-700 block mt-0.5">{record.retentionPeriod}</span>
                        ) : paRetentionType === 'None' ? (
                          <span className="text-rose-700 block mt-0.5">No defined data retention policy.</span>
                        ) : null}
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-900 mb-1">Data Protection contact</span>
                        <span className="font-medium text-slate-800">{record.dataProtectionContact || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <span className="block text-[11px] font-bold text-slate-900">Personal data</span>
                    {paSubjectRows.length === 0 ? (
                      <p className="text-slate-400 italic">No data subject categories selected.</p>
                    ) : (
                      paSubjectRows.map(row => (
                        <div key={row.cat} className="space-y-1.5">
                          <span className="block font-semibold text-slate-800">{row.cat}</span>
                          {row.items.length === 0 ? (
                            <p className="text-slate-400 italic">No personal data categories mapped.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {row.items.map(item => (
                                <span
                                  key={item}
                                  className={`px-2 py-0.5 rounded border text-[11px] ${
                                    getPersonalDataMetadata(item).classification === 'Restricted'
                                      ? 'bg-rose-100 border-rose-300 text-rose-900 font-semibold'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-900">Technical and Organisational Security Measures (TOMs)</span>
                    {record.toms && record.toms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {record.toms.map((tom: string) => (
                          <span key={tom} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]">
                            {tom}
                            {tom === 'Other' && record.tomsOther ? ` (${record.tomsOther})` : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No TOMs documented on this record.</p>
                    )}
                  </div>
                </>
              )}

              {type !== 'processingActivities' && (
                <>
              {/* Description */}
              {record.description && (
                <div>
                  <h4 className="font-semibold uppercase text-slate-400 tracking-wider text-[10px] mb-1">
                    Description & Context
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                    {record.description}
                  </p>
                </div>
              )}

              {/* Processing Activity Overview Fields */}
              {type === 'processingActivities' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Processing Role
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{record.role}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Art. 6 Legal Basis
                    </span>
                    {usesControllerWizardOptions(record.role) ? (
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-800 text-sm block">
                          {record.legalBasis || 'Unassigned'}
                        </span>
                        {(record.legalBasis === 'Legitimate Interest of the Controller' || record.legalBasis === 'Legitimate Interest') && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                              record.liaFiled
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            }`}
                          >
                            {record.liaFiled ? '✓ LIA Filed & Confirmed' : '⚠️ Legitimate Interest selected but LIA has not been confirmed.'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-slate-500 text-xs italic">
                        N/A (Processor Record)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Retention Schedule
                    </span>
                    {record.retentionPolicyType === 'None' || !record.hasRetentionPolicy || record.retentionPeriod === 'None' || !record.retentionPeriod ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-300 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        No defined data retention policy.
                      </span>
                    ) : (
                      <span className="font-medium text-slate-800 text-xs block mt-0.5">
                        {record.retentionPeriod}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Record Owner
                    </span>
                    <span className="font-medium text-slate-800">{record.owner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      High-Risk Personal Data
                    </span>
                    <span className={`font-semibold ${record.involvesHighRiskData ? 'text-rose-600' : 'text-slate-700'}`}>
                      {record.involvesHighRiskData ? 'Yes (DPIA Recommended)' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Transfer Safeguards
                    </span>
                    {destinationSafeguardLines(record, assets).length === 0 ? (
                      <span className="font-medium text-slate-800">None</span>
                    ) : (
                      <div className="space-y-1 mt-0.5">
                        {destinationSafeguardLines(record, assets).map(line => (
                          <span key={line.assetId || 'legacy'} className="font-medium text-slate-800 block">
                            {line.assetName ? `${line.assetName}: ${line.safeguard || 'None'}` : (line.safeguard || 'None')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Subjects & Personal Data Mappings */}
              {type === 'processingActivities' && (
                <div className="space-y-3">
                  <h4 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">
                    Data Subjects & Mapped Personal Data
                  </h4>
                  {record.dataSubjectPersonalDataMap && Object.keys(record.dataSubjectPersonalDataMap).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(record.dataSubjectPersonalDataMap as Record<string, string[]>).map(([subject, items]) => (
                        <div key={subject} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                              {subject}
                            </span>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                              {items.length} Assigned {items.length === 1 ? 'Category' : 'Categories'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {items.map(itemName => {
                              const meta = getPersonalDataMetadata(itemName);
                              return (
                                <span
                                  key={itemName}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium ${
                                    meta.isHighRisk
                                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  {meta.isHighRisk && <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />}
                                  {meta.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
                      Categories: {(record.dataSubjectCategories || []).join(', ') || 'None listed'}
                    </div>
                  )}
                </div>
              )}

              {/* Recipients & Disclosures */}
              {type === 'processingActivities' && (
                <div className="space-y-3">
                  <h4 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">
                    Categories of Recipients & Data Disclosures
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Recipient Categories
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {record.recipientCategories && record.recipientCategories.length > 0 ? (
                          record.recipientCategories.map((rc: string) => (
                            <span
                              key={rc}
                              className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800 font-medium text-[11px]"
                            >
                              {rc}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">None specified</span>
                        )}
                      </div>
                    </div>

                    {record.specifiedTrimbleProductTeam && (
                      <div className="p-2.5 bg-indigo-50/70 rounded-md border border-indigo-200">
                        <span className="text-[10px] uppercase font-bold text-indigo-900 block">
                          Specified Trimble Product Team
                        </span>
                        <span className="font-semibold text-indigo-950 text-xs">
                          {record.specifiedTrimbleProductTeam}
                        </span>
                      </div>
                    )}

                    {record.specifiedThirdParty && (
                      <div className="p-2.5 bg-amber-50/70 rounded-md border border-amber-200">
                        <span className="text-[10px] uppercase font-bold text-amber-900 block">
                          Specified Third Party
                        </span>
                        <span className="font-semibold text-amber-950 text-xs">
                          {record.specifiedThirdParty}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* International Data Transfers */}
              {type === 'processingActivities' && (
                <div className="space-y-3">
                  <h4 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">
                    International Transfers & Safeguards
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Transfer Status:</span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded text-xs ${
                          record.hasInternationalTransfer === 'Yes'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : record.hasInternationalTransfer === 'Unknown'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {record.hasInternationalTransfer || 'No'}
                      </span>
                    </div>

                    {record.hasInternationalTransfer === 'Unknown' && (
                      <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-900 space-y-0.5">
                        <span className="font-bold block text-xs">Review Required</span>
                        <p className="text-[11px] text-amber-800">
                          International transfer status requires review for this record.
                        </p>
                      </div>
                    )}

                    {record.hasInternationalTransfer === 'Yes' && (
                      <>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Destination Regions
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {record.selectedTransferRegions && record.selectedTransferRegions.length > 0 ? (
                              record.selectedTransferRegions.map((r: string) => (
                                <span
                                  key={r}
                                  className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]"
                                >
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">None selected</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                            Destination Countries & Hierarchy Mapping
                          </span>
                          {record.internationalTransferDetails && record.internationalTransferDetails.length > 0 ? (
                            <div className="space-y-2">
                              {record.internationalTransferDetails.map((dt: any) => (
                                <div
                                  key={dt.id || dt.country}
                                  className="p-2.5 bg-slate-50 rounded-md border border-slate-200 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900 text-xs">{dt.country}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-semibold">
                                      {dt.safeguard} {dt.specifiedSafeguard ? `(${dt.specifiedSafeguard})` : ''}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Destination Country ({dt.country}) → Region ({dt.region}) → Safeguard ({dt.safeguard})
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2.5 bg-rose-50 rounded-md border border-rose-200 text-rose-800 text-[11px] font-medium">
                              Transfer safeguard requires review. No destination country configurations provided.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

                </>
              )}

              {/* Asset Specific Overview */}
              {type === 'assets' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Asset Type
                      </span>
                      <span className="font-semibold text-slate-800">{record.assetType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Managing Organisation
                      </span>
                      <span className="font-semibold text-slate-800">{record.managingOrganisation || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        IT Owner / System Custodian
                      </span>
                      <span className="font-semibold text-slate-800">{record.itOwner || record.owner || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Hosting Type
                      </span>
                      <span className="font-medium text-slate-800">{record.hostingType || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Hosting Provider
                      </span>
                      <span className="font-medium text-slate-800">{record.hostingProvider || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Data Classification
                      </span>
                      <ClassificationBadge classification={record.dataClassification} />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                        Primary Hosting Location
                      </span>
                      <span className="font-semibold text-slate-800">{record.primaryHostingLocation || record.hostingLocation}</span>
                    </div>
                    {record.additionalHostingLocations && record.additionalHostingLocations.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                          Additional Hosting Locations
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {record.additionalHostingLocations.map((loc: string) => (
                            <span key={loc} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Specific Overview */}
              {type === 'vendors' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      DPA Status
                    </span>
                    <DpaStatusBadge dpaStatus={record.dpaStatus} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Headquarters
                    </span>
                    <span className="font-medium text-slate-800">{record.headquarters}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Privacy Contact
                    </span>
                    <span className="font-mono text-slate-700">{record.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Website
                    </span>
                    <a href={record.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {record.website || 'N/A'}
                    </a>
                  </div>
                </div>
              )}

              {/* Entity Specific Overview */}
              {type === 'entities' && (
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Jurisdiction
                    </span>
                    <span className="font-semibold text-slate-800">{record.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Registration #
                    </span>
                    <span className="font-mono text-slate-800">{record.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      DPO Contact
                    </span>
                    <span className="font-medium text-slate-800">{record.dpoContact}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Address
                    </span>
                    <span className="text-slate-700">{record.address || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Security Controls & TSP Registration Status */}
              {type !== 'processingActivities' && ('toms' in record || 'tspStatus' in record) && (
                <div className="space-y-3">
                  <h4 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">
                    Technical & Organisational Security Measures (TOMs) & TSP Status
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    {record.tspStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">TSP Registration Status:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            record.tspStatus === 'Yes'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : record.tspStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : record.tspStatus === 'N/A'
                              ? 'bg-purple-100 text-purple-950 border border-purple-300'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {record.tspStatus === 'Pending' && <Clock className="w-3 h-3 text-amber-800 inline-block mr-1" />}
                          {record.tspStatus}
                        </span>
                      </div>
                    )}

                    {record.tspStatus === 'N/A' && record.tspJustification && (
                      <div className="p-2.5 bg-purple-50/70 rounded-md border border-purple-200 text-purple-900">
                        <span className="text-[10px] uppercase font-bold text-purple-950 block">TSP Justification</span>
                        <p className="text-xs text-purple-900 italic mt-0.5">{record.tspJustification}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Documented Security Controls (TOMs)
                      </span>
                      {record.toms && record.toms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {record.toms.map((tom: string) => (
                            <span
                              key={tom}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]"
                            >
                              {tom}
                              {tom === 'Other' && record.tomsOther && ` (${record.tomsOther})`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No TOMs documented directly on this record.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tags / Categories Chips */}
              {type !== 'processingActivities' && record.tags && record.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold uppercase text-slate-400 tracking-wider text-[10px] mb-1.5">
                    Categorization Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {record.tags.map((tag: string) => (
                      <TagChip key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



          {activeTab === 'related' && type === 'processingActivities' && (
            <div className="space-y-6 text-xs">
              {relatedSections.map(section => {
                const SectionIcon = section.icon;
                const total = section.groups.reduce((sum, g) => sum + g.items.length, 0);
                return (
                  <div key={section.title} className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <SectionIcon className={`w-3.5 h-3.5 ${section.iconClass}`} />
                      {section.title} ({total})
                    </h4>
                    {section.groups.map(group => (
                      <div key={group.label || 'items'} className="space-y-1.5">
                        {group.label && (
                          <span className="block text-[11px] font-semibold text-slate-600">
                            {group.label} ({group.items.length})
                          </span>
                        )}
                        {group.items.length === 0 ? (
                          <p className="text-slate-400 italic">None linked.</p>
                        ) : (
                          <div className="space-y-1">
                            {group.items.map((item: any) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedRecord({ id: item.id, type: group.type })}
                                className="w-full p-2.5 rounded bg-white border border-slate-200 hover:border-indigo-300 transition cursor-pointer flex items-center gap-2 text-left"
                              >
                                <span className="font-mono text-[11px] font-bold text-slate-500">{item.id}</span>
                                <span className="font-semibold text-slate-800">{item.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'flaggedRisks' && type === 'processingActivities' && (
            <div className="space-y-6 text-xs">
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-xs">Personal data</h4>
                <div>
                  <span className="block text-[11px] font-bold text-slate-900 mb-1">Restricted categories of data</span>
                  {restrictedRows.length === 0 ? (
                    <p className="text-slate-400 italic">No restricted categories of data selected.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                      {restrictedRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between gap-3 p-2.5 rounded border border-rose-300 bg-rose-50">
                          <span className="font-semibold text-rose-900">{row.name}</span>
                          <span className="text-[11px] text-rose-800 text-right">{row.subjects.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {paRetentionType === 'None' && (
                <div className="bg-white p-4 rounded-lg border border-rose-300 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Data retention status</h4>
                  <p className="text-rose-700 font-medium">No defined data retention policy.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'dataFlow' && type === 'processingActivities' && (
            <div className="space-y-6">
              <ActivityTransferChart
                assets={assets}
                sourceAssetId={(record.dataSourceAssetIds || [])[0] || ''}
                destinationAssetIds={record.dataDestinationAssetIds || []}
                links={resolveTransferLinks(record)}
              />
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete ${record.id} permanently? This cannot be undone.`)) {
                  deleteRecord(type, id);
                }
              }}
              className="px-4 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>
            <button
              type="button"
              onClick={() => {
              setSelectedRecord(null);
              onEditRecord(type, id);
            }}
              className="px-4 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
