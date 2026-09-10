import React, { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  Copy,
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
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { InventoryType, ProcessingActivity, TSPReference, Asset, Vendor, Entity } from '../../types/privacy';
import { StatusBadge, ClassificationBadge, DpaStatusBadge, TagChip } from '../common/Badge';
import { DataFlowDiagram } from '../common/DataFlowDiagram';
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
    duplicateRecord,
    getRelatedRecords,
  } = usePrivacyData();

  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'governance' | 'dataFlow'>('overview');

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

  // Calculate Bidirectional Relationships
  const relations = getRelatedRecords(id, type);

  const getInventoryTitle = (invType: InventoryType) => {
    switch (invType) {
      case 'processingActivities':
        return 'Processing Activity';
      case 'tspReferences':
        return 'TSP / Product Ref';
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
      if (pa.retentionPolicyType === 'None' || !pa.hasRetentionPolicy || !pa.retentionPeriod || pa.retentionPeriod === 'None') {
        gaps.push({ title: 'No defined data retention policy.', desc: 'This processing activity operates without a formal retention schedule (GDPR Art. 5(1)(e)).', severity: 'high' });
      }
      const isController = pa.role === 'Controller' || pa.role === 'Joint Controller';
      if (isController) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
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
              <span className="text-xs text-slate-500 font-medium">({getInventoryTitle(type)})</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{record.name}</h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEditRecord(type, id)}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
              title="Edit Record"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => duplicateRecord(type, id)}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
              title="Duplicate Record"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete ${record.id}?`)) {
                  deleteRecord(type, id);
                }
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Delete Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
            Overview & Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'relationships'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connected Lineage
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 font-mono text-[10px] text-slate-600">
              {relations.processingActivities.length +
                relations.tspReferences.length +
                relations.assets.length +
                relations.vendors.length +
                relations.entities.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'governance'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Governance & Metadata
            {attentionGaps.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
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
                  actionButton={
                    <button
                      type="button"
                      onClick={() => onEditRecord(type, id)}
                      className="text-xs px-2.5 py-1 bg-white border border-rose-300 font-semibold text-rose-800 rounded hover:bg-rose-50"
                    >
                      Resolve
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs">
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
                    {record.role === 'Controller' || record.role === 'Joint Controller' ? (
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
                    <span className="font-medium text-slate-800">{record.transferSafeguards || 'None'}</span>
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
              {('toms' in record || 'tspStatus' in record) && (
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
              {record.tags && record.tags.length > 0 && (
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

          {/* TAB 2: Connected Lineage (Bidirectional Display!) */}
          {activeTab === 'relationships' && (
            <div className="space-y-6 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-md text-indigo-950 text-xs">
                <p className="font-semibold">Bidirectional Lineage Map</p>
                <p className="mt-0.5 text-[11px] text-indigo-800">
                  Showing all inventories interconnected with <strong>{record.name}</strong> ({record.id}). Clicking any record automatically opens its connected profile.
                </p>
              </div>

              {/* Related Processing Activities */}
              {type !== 'processingActivities' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Related Processing Activities ({relations.processingActivities.length})
                  </h4>
                  {relations.processingActivities.length === 0 ? (
                    <p className="text-slate-400 italic">No connected processing activities.</p>
                  ) : (
                    <div className="space-y-1">
                      {relations.processingActivities.map(pa => (
                        <div
                          key={pa.id}
                          onClick={() => setSelectedRecord({ id: pa.id, type: 'processingActivities' })}
                          className="p-2.5 rounded bg-white border border-slate-200 hover:border-indigo-300 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{pa.id}</span>
                            <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition">
                              {pa.name}
                            </span>
                          </div>
                          <StatusBadge status={pa.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Related TSPs */}
              {type !== 'tspReferences' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    Related TSP / Product References ({relations.tspReferences.length})
                  </h4>
                  {relations.tspReferences.length === 0 ? (
                    <p className="text-slate-400 italic">No connected TSP references.</p>
                  ) : (
                    <div className="space-y-1">
                      {relations.tspReferences.map(tsp => (
                        <div
                          key={tsp.id}
                          onClick={() => setSelectedRecord({ id: tsp.id, type: 'tspReferences' })}
                          className="p-2.5 rounded bg-white border border-slate-200 hover:border-blue-300 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{tsp.id}</span>
                            <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                              {tsp.name}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{tsp.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Related Assets */}
              {type !== 'assets' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    Related Systems & Assets ({relations.assets.length})
                  </h4>
                  {relations.assets.length === 0 ? (
                    <p className="text-slate-400 italic">No connected assets.</p>
                  ) : (
                    <div className="space-y-1">
                      {relations.assets.map(ast => (
                        <div
                          key={ast.id}
                          onClick={() => setSelectedRecord({ id: ast.id, type: 'assets' })}
                          className="p-2.5 rounded bg-white border border-slate-200 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{ast.id}</span>
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                              {ast.name}
                            </span>
                          </div>
                          <ClassificationBadge classification={ast.dataClassification} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Related Vendors */}
              {type !== 'vendors' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    Related Vendors & Processors ({relations.vendors.length})
                  </h4>
                  {relations.vendors.length === 0 ? (
                    <p className="text-slate-400 italic">No connected vendors.</p>
                  ) : (
                    <div className="space-y-1">
                      {relations.vendors.map(v => (
                        <div
                          key={v.id}
                          onClick={() => setSelectedRecord({ id: v.id, type: 'vendors' })}
                          className="p-2.5 rounded bg-white border border-slate-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{v.id}</span>
                            <span className="font-semibold text-slate-800 group-hover:text-amber-600 transition">
                              {v.name}
                            </span>
                          </div>
                          <DpaStatusBadge dpaStatus={v.dpaStatus} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Related Entities */}
              {type !== 'entities' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-purple-600" />
                    Related Legal Entities ({relations.entities.length})
                  </h4>
                  {relations.entities.length === 0 ? (
                    <p className="text-slate-400 italic">No connected legal entities.</p>
                  ) : (
                    <div className="space-y-1">
                      {relations.entities.map(e => (
                        <div
                          key={e.id}
                          onClick={() => setSelectedRecord({ id: e.id, type: 'entities' })}
                          className="p-2.5 rounded bg-white border border-slate-200 hover:border-purple-300 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">{e.id}</span>
                            <span className="font-semibold text-slate-800 group-hover:text-purple-600 transition">
                              {e.name}
                            </span>
                          </div>
                          <span className="text-slate-600 font-medium text-[11px]">{e.jurisdiction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Governance & Audit Metadata */}
          {activeTab === 'governance' && (
            <div className="space-y-6 text-xs">
              {/* TOMs list for PAs */}
              {type === 'processingActivities' && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Technical & Organizational Security Measures (TOMs)
                  </h4>
                  {(!record.toms || record.toms.length === 0) ? (
                    <p className="text-rose-600 italic font-medium">No TOMs security safeguards assigned yet!</p>
                  ) : (
                    <div className="space-y-1">
                      {record.toms.map((tom: string) => (
                        <div key={tom} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800">{tom}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* System Audit Information */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  System Audit Metadata
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Created Date</span>
                    <span>{new Date(record.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Created By</span>
                    <span className="font-mono text-[11px] text-slate-700">{record.createdBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Last Modified</span>
                    <span>{new Date(record.lastModifiedDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Modified By</span>
                    <span className="font-mono text-[11px] text-slate-700">{record.lastModifiedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dataFlow' && type === 'processingActivities' && (
            <DataFlowDiagram processingActivityId={id} />
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

          <button
            type="button"
            onClick={() => onEditRecord(type, id)}
            className="px-4 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Record
          </button>
        </div>
      </div>
    </div>
  );
};
