import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Shield, Network, AlertCircle, AlertTriangle } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { Vendor, DpaStatus, StatusType, TSPStatusOption } from '../../types/privacy';
import { SecurityMeasuresSection } from '../common/SecurityMeasuresSection';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIdToEdit?: string | null;
}

const COMMON_CERTIFICATIONS = [
  'ISO 27001',
  'SOC 2 Type II',
  'SOC 1 Type II',
  'GDPR Compliant',
  'PCI-DSS',
  'ISO 27018',
  'HIPAA Compliant',
  'FedRAMP',
];

export const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  onClose,
  recordIdToEdit,
}) => {
  const {
    vendors,
    assets,
    processingActivities,
    tspReferences,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);

  // Core Vendor Fields
  const [name, setName] = useState('');
  const [dpaStatus, setDpaStatus] = useState<DpaStatus>('Signed');
  const [headquarters, setHeadquarters] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [securityCertifications, setSecurityCertifications] = useState<string[]>(['ISO 27001', 'SOC 2 Type II']);
  const [customCert, setCustomCert] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StatusType>('Approved');

  // Security Measures State
  const [tspStatus, setTspStatus] = useState<TSPStatusOption>('Yes');
  const [tspJustification, setTspJustification] = useState('');
  const [toms, setToms] = useState<string[]>(['Encryption in transit', 'Role Based Access Controls']);
  const [tomsOther, setTomsOther] = useState('');

  // Relationship States
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [processingActivityIds, setProcessingActivityIds] = useState<string[]>([]);
  const [tspIds, setTspIds] = useState<string[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'relationships'>('overview');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      const existing = vendors.find(v => v.id === recordIdToEdit);
      if (existing) {
        setName(existing.name || '');
        setDpaStatus(existing.dpaStatus || 'Signed');
        setHeadquarters(existing.headquarters || '');
        setContactEmail(existing.contactEmail || '');
        setWebsite(existing.website || '');
        setSecurityCertifications(existing.securityCertifications || []);
        setDescription(existing.description || '');
        setStatus(existing.status || 'Approved');

        setTspStatus((existing.tspStatus as TSPStatusOption) || 'Yes');
        setTspJustification(existing.tspJustification || '');
        setToms(existing.toms || []);
        setTomsOther(existing.tomsOther || '');

        setAssetIds(existing.assetIds || []);

        // Compute PA relationships
        const linkedPaIds = existing.processingActivityIds || [];
        const reversePaIds = processingActivities
          .filter(pa => (pa.vendorIds || []).includes(existing.id))
          .map(pa => pa.id);
        setProcessingActivityIds(Array.from(new Set([...linkedPaIds, ...reversePaIds])));

        // Compute TSP relationships
        const linkedTspIds = existing.tspIds || [];
        const reverseTspIds = tspReferences
          .filter(t => (t.vendorIds || []).includes(existing.id))
          .map(t => t.id);
        setTspIds(Array.from(new Set([...linkedTspIds, ...reverseTspIds])));
      }
    } else {
      setName('');
      setDpaStatus('Signed');
      setHeadquarters('San Francisco, CA, USA');
      setContactEmail('privacy@vendor.com');
      setWebsite('');
      setSecurityCertifications(['ISO 27001', 'SOC 2 Type II']);
      setCustomCert('');
      setDescription('');
      setStatus('Approved');
      setTspStatus('Yes');
      setTspJustification('');
      setToms(['Encryption in transit', 'Role Based Access Controls']);
      setTomsOther('');
      setAssetIds([]);
      setProcessingActivityIds([]);
      setTspIds([]);
      setErrors({});
    }
  }, [isOpen, isEdit, recordIdToEdit, vendors, processingActivities, tspReferences]);

  if (!isOpen) return null;

  // Real-time duplicate check
  const duplicateMatch = name.trim()
    ? vendors.find(
        v => v.id !== recordIdToEdit && v.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    : null;

  const toggleCertification = (cert: string) => {
    if (securityCertifications.includes(cert)) {
      setSecurityCertifications(securityCertifications.filter(c => c !== cert));
    } else {
      setSecurityCertifications([...securityCertifications, cert]);
    }
  };

  const addCustomCert = () => {
    if (customCert.trim() && !securityCertifications.includes(customCert.trim())) {
      setSecurityCertifications([...securityCertifications, customCert.trim()]);
      setCustomCert('');
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Vendor Name is required';
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

    const payload: Omit<Vendor, 'id' | 'createdDate' | 'lastModifiedDate'> = {
      name: name.trim(),
      dpaStatus,
      headquarters: headquarters.trim(),
      contactEmail: contactEmail.trim(),
      website: website.trim(),
      securityCertifications,
      description: description.trim(),
      status,
      tspStatus,
      tspJustification: tspStatus === 'N/A' ? tspJustification.trim() : '',
      toms,
      tomsOther: toms.includes('Other') ? tomsOther.trim() : '',
      assetIds,
      processingActivityIds,
      tspIds,
      entityIds: [],
      createdBy: 'Current User',
      lastModifiedBy: 'Current User',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('vendors', recordIdToEdit, payload as Partial<Vendor>);
    } else {
      addRecord('vendors', payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit Vendor: ${name}` : 'Register New Vendor / Processor'}
              </h2>
              <p className="text-xs text-slate-500">
                Document third-party vendors, data processors, sub-processors, and hosting partners.
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
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            1. Vendor Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'security'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. TOMs & Certifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'relationships'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            3. Inventory Relationships ({assetIds.length + processingActivityIds.length + tspIds.length})
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
                    <span className="font-bold text-amber-950 block">Potential Duplicate Vendor Warning</span>
                    A vendor named <strong>"{duplicateMatch.name}"</strong> (ID: <code>{duplicateMatch.id}</code>) already exists. Please check to avoid duplicate records.
                  </div>
                </div>
              )}

              {/* Vendor Name & DPA Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Vendor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. AWS Cloud Services, Salesforce Inc."
                    className={`w-full px-3 py-2 text-sm rounded-md border ${
                      errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-amber-500'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    DPA Execution Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={dpaStatus}
                    onChange={e => setDpaStatus(e.target.value as DpaStatus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Signed">Signed (DPA Fully Executed)</option>
                    <option value="In Review">In Review (Legal Reviewing)</option>
                    <option value="Not Required">Not Required (Non-personal data)</option>
                    <option value="Expired">Expired (Requires Renewal)</option>
                  </select>
                </div>
              </div>

              {/* HQ Location, Email, Website */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Headquarters / Country
                  </label>
                  <input
                    type="text"
                    value={headquarters}
                    onChange={e => setHeadquarters(e.target.value)}
                    placeholder="e.g. San Francisco, CA, USA"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Privacy Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="dpo@vendor.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://vendor.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Approval Status */}
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Approval Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as StatusType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Vendor Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Vendor Description & Business Purpose
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Overview of vendor services, sub-processor role, and data processing scope..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: SECURITY & CERTIFICATIONS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">

              {/* Security Certifications Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Vendor Security Certifications & Compliance Reports
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_CERTIFICATIONS.map(cert => {
                    const isSelected = securityCertifications.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCertification(cert)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-100 border-amber-300 text-amber-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cert}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Certification Input */}
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={customCert}
                    onChange={e => setCustomCert(e.target.value)}
                    placeholder="Add custom certification (e.g. C5, TISAX)"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomCert}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Technical & Organisational Security Measures */}
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
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                Connect this vendor to related Assets, Processing Activities, and TSP references. All connections maintain bidirectional synchronization automatically.
              </div>

              {/* Connected Assets */}
              <SearchableRelationshipSelector
                label="Related Systems & Assets"
                targetInventoryType="assets"
                availableItems={assets}
                selectedIds={assetIds}
                onChange={setAssetIds}
                helperText="Infrastructure systems, databases, or cloud instances operated by or hosted with this vendor."
              />

              {/* Connected Processing Activities */}
              <SearchableRelationshipSelector
                label="Related Processing Activities"
                targetInventoryType="processingActivities"
                availableItems={processingActivities}
                selectedIds={processingActivityIds}
                onChange={setProcessingActivityIds}
                helperText="Processing activities where this vendor acts as a processor or sub-processor."
              />

              {/* Connected TSPs */}
              <SearchableRelationshipSelector
                label="Related TSP / Product References"
                targetInventoryType="tspReferences"
                availableItems={tspReferences}
                selectedIds={tspIds}
                onChange={setTspIds}
                helperText="Product references and SaaS platform instances licensed from this vendor."
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-2xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Vendor' : 'Save Vendor'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
