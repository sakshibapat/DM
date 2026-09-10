import React, { useState, useEffect } from 'react';
import { X, Save, Cpu, Shield, Network, AlertCircle, AlertTriangle } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { TSPReference, StatusType, TSPStatusOption } from '../../types/privacy';
import { SecurityMeasuresSection } from '../common/SecurityMeasuresSection';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';

interface TSPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIdToEdit?: string | null;
}

const TSP_CATEGORY_OPTIONS = [
  'SaaS Platform',
  'Infrastructure Provider',
  'Database Engine',
  'Analytics Service',
  'Security & Identity Provider',
  'Communication & Messaging',
  'Customer Support Tool',
  'AI / Machine Learning Model',
  'Other',
];

export const TSPFormModal: React.FC<TSPFormModalProps> = ({
  isOpen,
  onClose,
  recordIdToEdit,
}) => {
  const {
    tspReferences,
    assets,
    processingActivities,
    vendors,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);

  // Form states
  const [name, setName] = useState('');
  const [tspReference, setTspReference] = useState('');
  const [category, setCategory] = useState(TSP_CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [versionOrPlan, setVersionOrPlan] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StatusType>('Approved');

  // Security Measures State
  const [tspStatus, setTspStatus] = useState<TSPStatusOption>('Yes');
  const [tspJustification, setTspJustification] = useState('');
  const [toms, setToms] = useState<string[]>(['Encryption in transit', 'Role Based Access Controls']);
  const [tomsOther, setTomsOther] = useState('');

  // Relationship states
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [processingActivityIds, setProcessingActivityIds] = useState<string[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'relationships'>('overview');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      const existing = tspReferences.find(t => t.id === recordIdToEdit);
      if (existing) {
        setName(existing.name || '');
        setTspReference(existing.tspReference || existing.id || '');
        setVersionOrPlan(existing.versionOrPlan || '');
        setDescription(existing.description || '');
        setStatus(existing.status || 'Approved');

        if (existing.category && TSP_CATEGORY_OPTIONS.includes(existing.category)) {
          setCategory(existing.category);
          setCustomCategory('');
        } else if (existing.category) {
          setCategory('Other');
          setCustomCategory(existing.category);
        } else {
          setCategory(TSP_CATEGORY_OPTIONS[0]);
        }

        setTspStatus((existing.tspStatus as TSPStatusOption) || 'Yes');
        setTspJustification(existing.tspJustification || '');
        setToms(existing.toms || []);
        setTomsOther(existing.tomsOther || '');

        setAssetIds(existing.assetIds || []);
        setVendorIds(existing.vendorIds || []);

        // Compute PA relationships
        const linkedPaIds = existing.processingActivityIds || [];
        const reversePaIds = processingActivities
          .filter(pa => (pa.tspIds || []).includes(existing.id))
          .map(pa => pa.id);
        const combinedPaIds = Array.from(new Set([...linkedPaIds, ...reversePaIds]));
        setProcessingActivityIds(combinedPaIds);
      }
    } else {
      setName('');
      setTspReference(`TSP-REF-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(TSP_CATEGORY_OPTIONS[0]);
      setCustomCategory('');
      setVersionOrPlan('');
      setDescription('');
      setStatus('Approved');
      setTspStatus('Yes');
      setTspJustification('');
      setToms(['Encryption in transit', 'Role Based Access Controls']);
      setTomsOther('');
      setAssetIds([]);
      setProcessingActivityIds([]);
      setVendorIds([]);
      setErrors({});
    }
  }, [isOpen, isEdit, recordIdToEdit, tspReferences, processingActivities]);

  if (!isOpen) return null;

  // Duplicate name warning
  const duplicateMatch = name.trim()
    ? tspReferences.find(
        t => t.id !== recordIdToEdit && t.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    : null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Product / TSP Name is required';
    }
    if (category === 'Other' && !customCategory.trim()) {
      newErrors.category = 'Please specify custom category';
    }
    if (tspStatus === 'N/A' && !tspJustification.trim()) {
      newErrors.tspJustification = 'Justification required when TSP status is N/A';
    }
    if (toms.includes('Other') && !tomsOther.trim()) {
      newErrors.tomsOther = 'Description required when Other TOM is selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    const payload: Omit<TSPReference, 'id' | 'createdDate' | 'lastModifiedDate'> = {
      name: name.trim(),
      tspReference: tspReference.trim() || name.trim(),
      category: finalCategory,
      versionOrPlan: versionOrPlan.trim(),
      description: description.trim(),
      status,
      tspStatus,
      tspJustification: tspStatus === 'N/A' ? tspJustification.trim() : '',
      toms,
      tomsOther: toms.includes('Other') ? tomsOther.trim() : '',
      assetIds,
      processingActivityIds,
      vendorIds,
      entityIds: [],
      createdBy: 'Current User',
      lastModifiedBy: 'Current User',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('tspReferences', recordIdToEdit, payload as Partial<TSPReference>);
    } else {
      addRecord('tspReferences', payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit TSP / Product Reference: ${name}` : 'Register New TSP / Product Reference'}
              </h2>
              <p className="text-xs text-slate-500">
                Register software products, cloud services, and technical service provider references.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            1. Product Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Security Controls (TOMs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'relationships'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            3. Inventory Relationships ({assetIds.length + processingActivityIds.length + vendorIds.length})
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">

              {/* Duplicate Warning */}
              {duplicateMatch && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block">Potential Duplicate Record Warning</span>
                    A record named <strong>"{duplicateMatch.name}"</strong> (ID: <code>{duplicateMatch.id}</code>) already exists in TSP / Product References. Please verify you are not creating a redundant duplicate.
                  </div>
                </div>
              )}

              {/* Product Name & Reference ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Product / TSP Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Salesforce Sales Cloud"
                    className={`w-full px-3 py-2 text-sm rounded-md border ${
                      errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    TSP / Product Reference ID
                  </label>
                  <input
                    type="text"
                    value={tspReference}
                    onChange={e => setTspReference(e.target.value)}
                    placeholder="e.g. PROD-SALESFORCE-01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Unique reference code used in technical mapping.</p>
                </div>
              </div>

              {/* Category & Version / Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Product Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TSP_CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {category === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Category <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Enter custom product category"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Version / Plan Details
                  </label>
                  <input
                    type="text"
                    value={versionOrPlan}
                    onChange={e => setVersionOrPlan(e.target.value)}
                    placeholder="e.g. Enterprise Edition v2.4"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as StatusType)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Product Description & Usage Scope
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Functional description, technology stack, and architectural role..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: SECURITY MEASURES */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-150">
              <SecurityMeasuresSection
                tspStatus={tspStatus}
                onTspStatusChange={setTspStatus}
                tspJustification={tspJustification}
                onTspJustificationChange={setTspJustification}
                toms={toms}
                onTomsChange={setToms}
                tomsOther={tomsOther}
                onTomsOtherChange={setTomsOther}
                errors={{
                  tspJustification: errors.tspJustification,
                  tomsOther: errors.tomsOther,
                }}
              />
            </div>
          )}

          {/* TAB 3: RELATIONSHIPS */}
          {activeTab === 'relationships' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Connect this TSP / Product reference to associated Assets, Processing Activities, and Vendors. Relationships update automatically in both directions.
              </div>

              {/* Connected Assets */}
              <SearchableRelationshipSelector
                label="Related Systems & Assets"
                targetInventoryType="assets"
                availableItems={assets}
                selectedIds={assetIds}
                onChange={setAssetIds}
                helperText="System assets or databases powered by or built on this product reference."
              />

              {/* Connected Processing Activities */}
              <SearchableRelationshipSelector
                label="Related Processing Activities"
                targetInventoryType="processingActivities"
                availableItems={processingActivities}
                selectedIds={processingActivityIds}
                onChange={setProcessingActivityIds}
                helperText="Business processing activities that utilize this technical product reference."
              />

              {/* Connected Vendors */}
              <SearchableRelationshipSelector
                label="Related Vendors & Service Providers"
                targetInventoryType="vendors"
                availableItems={vendors}
                selectedIds={vendorIds}
                onChange={setVendorIds}
                helperText="Third-party vendor entities providing or licensing this product."
              />
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {Object.keys(errors).length > 0 && (
              <span className="text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-4 h-4" /> Please resolve errors before saving.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update TSP Reference' : 'Save TSP Reference'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
