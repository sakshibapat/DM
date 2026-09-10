import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Check } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import {
  InventoryType,
  StatusType,
  ProcessingRole,
  LegalBasis,
  AssetType,
  DataClassification,
  DpaStatus,
} from '../../types/privacy';
import { TextField } from '../common/TextField';
import { Select } from '../common/Select';
import { MultiSelect } from '../common/MultiSelect';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';
import { ProcessingActivityFormModal } from './ProcessingActivityFormModal';
import { AssetFormModal } from './AssetFormModal';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryType: InventoryType;
  recordIdToEdit?: string | null;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  onClose,
  inventoryType,
  recordIdToEdit,
}) => {
  const {
    processingActivities,
    tspReferences,
    assets,
    vendors,
    entities,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);

  // Default initial form state
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    status: 'Approved' as StatusType,
    tags: [],
    // PA
    role: 'Controller' as ProcessingRole,
    legalBasis: 'Legitimate Interest' as LegalBasis,
    owner: '',
    retentionPeriod: '3 Years',
    hasRetentionPolicy: true,
    personalDataCategories: ['Contact Info'],
    involvesHighRiskData: false,
    transferSafeguards: 'EU Standard Contractual Clauses (SCCs)',
    toms: ['AES-256 Encryption at Rest', 'TLS 1.3 in Transit'],
    dataSubjectCategories: ['Customers'],
    tspIds: [],
    assetIds: [],
    vendorIds: [],
    entityIds: [],
    // TSP
    category: 'SaaS Application',
    versionOrPlan: '',
    // Asset
    assetType: 'Database' as AssetType,
    dataClassification: 'Confidential' as DataClassification,
    hostingLocation: 'AWS US-East',
    // Vendor
    dpaStatus: 'Signed' as DpaStatus,
    headquarters: 'San Francisco, CA, USA',
    contactEmail: 'privacy@vendor.com',
    securityCertifications: ['ISO 27001', 'SOC 2 Type II'],
    website: '',
    // Entity
    jurisdiction: 'EU - Netherlands',
    registrationNumber: '',
    dpoContact: '',
    address: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate form if editing
  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      let existing: any = null;
      if (inventoryType === 'processingActivities') existing = processingActivities.find(x => x.id === recordIdToEdit);
      if (inventoryType === 'tspReferences') existing = tspReferences.find(x => x.id === recordIdToEdit);
      if (inventoryType === 'assets') existing = assets.find(x => x.id === recordIdToEdit);
      if (inventoryType === 'vendors') existing = vendors.find(x => x.id === recordIdToEdit);
      if (inventoryType === 'entities') existing = entities.find(x => x.id === recordIdToEdit);

      if (existing) {
        setFormData({ ...existing });
      }
    } else {
      // Reset defaults
      setFormData({
        name: '',
        description: '',
        status: 'Approved',
        tags: [],
        role: 'Controller',
        legalBasis: 'Legitimate Interest',
        owner: '',
        retentionPeriod: '3 Years',
        hasRetentionPolicy: true,
        personalDataCategories: ['Contact Info'],
        involvesHighRiskData: false,
        transferSafeguards: 'EU Standard Contractual Clauses (SCCs)',
        toms: ['AES-256 Encryption at Rest', 'TLS 1.3 in Transit'],
        dataSubjectCategories: ['Customers'],
        tspIds: [],
        assetIds: [],
        vendorIds: [],
        entityIds: [],
        category: 'SaaS Platform',
        versionOrPlan: '',
        assetType: 'Database',
        dataClassification: 'Confidential',
        hostingLocation: 'AWS Cloud',
        dpaStatus: 'Signed',
        headquarters: 'San Francisco, CA, USA',
        contactEmail: 'privacy@vendor.com',
        securityCertifications: ['ISO 27001', 'SOC 2 Type II'],
        website: '',
        jurisdiction: 'EU - Netherlands',
        registrationNumber: '',
        dpoContact: '',
        address: '',
      });
    }
  }, [isEdit, recordIdToEdit, inventoryType, isOpen]);

  if (inventoryType === 'processingActivities') {
    return (
      <ProcessingActivityFormModal
        isOpen={isOpen}
        onClose={onClose}
        recordIdToEdit={recordIdToEdit}
      />
    );
  }

  if (inventoryType === 'assets') {
    return (
      <AssetFormModal
        isOpen={isOpen}
        onClose={onClose}
        recordIdToEdit={recordIdToEdit}
      />
    );
  }

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Record name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && recordIdToEdit) {
      updateRecord(inventoryType, recordIdToEdit, formData);
    } else {
      addRecord(inventoryType, formData);
    }
    onClose();
  };

  const getInventoryTitle = (invType: InventoryType) => {
    switch (invType) {
      case 'processingActivities':
        return 'Processing Activity';
      case 'tspReferences':
        return 'TSP / Product Reference';
      case 'assets':
        return 'System & Asset';
      case 'vendors':
        return 'Vendor / Processor';
      case 'entities':
        return 'Legal Entity';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? `Edit ${getInventoryTitle(inventoryType)}` : `Create New ${getInventoryTitle(inventoryType)}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in required privacy metadata and map inventory relationships.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form id="recordForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Identifiers */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
              Basic Identifiers & Status
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <TextField
                  label="Record Name *"
                  placeholder={`e.g., ${
                    inventoryType === 'processingActivities'
                      ? 'Global Customer Payroll Processing'
                      : inventoryType === 'assets'
                      ? 'Production Snowflake DB'
                      : 'Salesforce Inc.'
                  }`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />
              </div>

              <div>
                <Select
                  label="Approval Status"
                  options={['Approved', 'Under Review', 'Draft', 'Archived']}
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as StatusType })}
                />
              </div>
            </div>

            <TextField
              label="Description & Business Context"
              multiline
              rows={2}
              placeholder="Describe the operational purpose, processing context, and data scope..."
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Section 2: Specific Inventory Fields */}
          {inventoryType === 'processingActivities' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
                RoPA Processing Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Processing Role"
                  options={['Controller', 'Processor', 'Joint Controller']}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as ProcessingRole })}
                />

                <Select
                  label="Art. 6 Legal Basis"
                  options={[
                    'Consent',
                    'Legitimate Interest',
                    'Contractual Necessity',
                    'Legal Obligation',
                    'Vital Interests',
                    'Public Task',
                  ]}
                  value={formData.legalBasis}
                  onChange={e => setFormData({ ...formData, legalBasis: e.target.value as LegalBasis })}
                />

                <TextField
                  label="Record Owner / Lead"
                  placeholder="e.g., Sarah Jenkins (VP HR)"
                  value={formData.owner || ''}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Retention Period"
                  placeholder="e.g., 7 Years after employment termination"
                  value={formData.retentionPeriod || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      retentionPeriod: e.target.value,
                      hasRetentionPolicy: Boolean(e.target.value.trim()),
                    })
                  }
                />

                <TextField
                  label="Transfer Safeguards"
                  placeholder="e.g., EU Standard Contractual Clauses (SCCs)"
                  value={formData.transferSafeguards || ''}
                  onChange={e => setFormData({ ...formData, transferSafeguards: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                <input
                  type="checkbox"
                  id="highRiskCheck"
                  checked={formData.involvesHighRiskData}
                  onChange={e => setFormData({ ...formData, involvesHighRiskData: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="highRiskCheck" className="text-xs font-semibold text-rose-950 cursor-pointer">
                  Involves High-Risk Personal Data (Special categories, biometrics, financial, AI scoring)
                </label>
              </div>

              <MultiSelect
                label="Personal Data Categories"
                selectedValues={formData.personalDataCategories || []}
                onChange={vals => setFormData({ ...formData, personalDataCategories: vals })}
                presetOptions={['Contact Info', 'Financial Data', 'Government Identifiers (SSN/Tax ID)', 'IP / Device Identifiers', 'Biometric', 'Health', 'Employment History']}
              />

              <MultiSelect
                label="Technical & Organizational Security Measures (TOMs)"
                selectedValues={formData.toms || []}
                onChange={vals => setFormData({ ...formData, toms: vals })}
                presetOptions={['AES-256 Encryption at Rest', 'TLS 1.3 in Transit', 'MFA Required', 'Strict RBAC Access Control', 'Pseudonymization', 'PCI-DSS Compliance']}
              />
            </div>
          )}

          {inventoryType === 'tspReferences' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
                TSP & Software Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Category / Platform Type"
                  placeholder="e.g., SaaS CRM, Cloud Infrastructure, Payment API"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
                <TextField
                  label="Version or Subscription Plan"
                  placeholder="e.g., Enterprise Edition v2026"
                  value={formData.versionOrPlan || ''}
                  onChange={e => setFormData({ ...formData, versionOrPlan: e.target.value })}
                />
              </div>
            </div>
          )}

          {inventoryType === 'assets' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
                Asset Infrastructure & Security
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Asset Type"
                  options={['Database', 'Server', 'Application', 'Cloud Storage', 'API Endpoint', 'Physical File System']}
                  value={formData.assetType}
                  onChange={e => setFormData({ ...formData, assetType: e.target.value as AssetType })}
                />
                <Select
                  label="Data Classification"
                  options={['Confidential', 'Restricted', 'Internal', 'Public']}
                  value={formData.dataClassification}
                  onChange={e => setFormData({ ...formData, dataClassification: e.target.value as DataClassification })}
                />
                <TextField
                  label="System Custodian / Owner"
                  placeholder="e.g., Marcus Vance"
                  value={formData.owner || ''}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                />
              </div>
              <TextField
                label="Hosting Location / Region"
                placeholder="e.g., AWS Frankfurt (eu-central-1)"
                value={formData.hostingLocation}
                onChange={e => setFormData({ ...formData, hostingLocation: e.target.value })}
              />
            </div>
          )}

          {inventoryType === 'vendors' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
                Vendor Compliance & DPAs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="DPA Status"
                  options={['Signed', 'In Review', 'Not Required', 'Expired']}
                  value={formData.dpaStatus}
                  onChange={e => setFormData({ ...formData, dpaStatus: e.target.value as DpaStatus })}
                />
                <TextField
                  label="Headquarters Location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.headquarters}
                  onChange={e => setFormData({ ...formData, headquarters: e.target.value })}
                />
                <TextField
                  label="Privacy / DPO Email"
                  placeholder="privacy@vendor.com"
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <MultiSelect
                label="Security & Privacy Certifications"
                selectedValues={formData.securityCertifications || []}
                onChange={vals => setFormData({ ...formData, securityCertifications: vals })}
                presetOptions={['ISO 27001', 'SOC 2 Type II', 'PCI-DSS Level 1', 'ISO 27018', 'EU-US Data Privacy Framework']}
              />
            </div>
          )}

          {inventoryType === 'entities' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
                Legal Establishment & Jurisdiction
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField
                  label="Jurisdiction / Region"
                  placeholder="e.g., EU - Netherlands, US - Delaware"
                  value={formData.jurisdiction}
                  onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
                />
                <TextField
                  label="Registration Number"
                  placeholder="e.g., KVK 74892011"
                  value={formData.registrationNumber}
                  onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
                <TextField
                  label="DPO Contact Person"
                  placeholder="e.g., Jan van der Berg, EU DPO"
                  value={formData.dpoContact}
                  onChange={e => setFormData({ ...formData, dpoContact: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Section 3: Bidirectional Relationship Selectors */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-1">
              Inventory Relationships & Lineage Mapping
            </h4>

            {inventoryType === 'processingActivities' && (
              <div className="space-y-4">
                <SearchableRelationshipSelector
                  label="Linked TSP / Product References"
                  targetInventoryType="tspReferences"
                  availableItems={tspReferences}
                  selectedIds={formData.tspIds || []}
                  onChange={ids => setFormData({ ...formData, tspIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked Systems & Assets"
                  targetInventoryType="assets"
                  availableItems={assets}
                  selectedIds={formData.assetIds || []}
                  onChange={ids => setFormData({ ...formData, assetIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked Vendors & Processors"
                  targetInventoryType="vendors"
                  availableItems={vendors}
                  selectedIds={formData.vendorIds || []}
                  onChange={ids => setFormData({ ...formData, vendorIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked Legal Entities"
                  targetInventoryType="entities"
                  availableItems={entities}
                  selectedIds={formData.entityIds || []}
                  onChange={ids => setFormData({ ...formData, entityIds: ids })}
                />
              </div>
            )}

            {inventoryType === 'tspReferences' && (
              <div className="space-y-4">
                <SearchableRelationshipSelector
                  label="Linked Assets"
                  targetInventoryType="assets"
                  availableItems={assets}
                  selectedIds={formData.assetIds || []}
                  onChange={ids => setFormData({ ...formData, assetIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked Vendors"
                  targetInventoryType="vendors"
                  availableItems={vendors}
                  selectedIds={formData.vendorIds || []}
                  onChange={ids => setFormData({ ...formData, vendorIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked Entities"
                  targetInventoryType="entities"
                  availableItems={entities}
                  selectedIds={formData.entityIds || []}
                  onChange={ids => setFormData({ ...formData, entityIds: ids })}
                />
              </div>
            )}

            {inventoryType === 'assets' && (
              <div className="space-y-4">
                <SearchableRelationshipSelector
                  label="Linked Vendors"
                  targetInventoryType="vendors"
                  availableItems={vendors}
                  selectedIds={formData.vendorIds || []}
                  onChange={ids => setFormData({ ...formData, vendorIds: ids })}
                />
                <SearchableRelationshipSelector
                  label="Linked TSP / Product References"
                  targetInventoryType="tspReferences"
                  availableItems={tspReferences}
                  selectedIds={formData.tspIds || []}
                  onChange={ids => setFormData({ ...formData, tspIds: ids })}
                />
              </div>
            )}

            {inventoryType === 'vendors' && (
              <SearchableRelationshipSelector
                label="Linked Assets"
                targetInventoryType="assets"
                availableItems={assets}
                selectedIds={formData.assetIds || []}
                onChange={ids => setFormData({ ...formData, assetIds: ids })}
              />
            )}
          </div>

          <MultiSelect
            label="Custom Enterprise Tags"
            selectedValues={formData.tags || []}
            onChange={tags => setFormData({ ...formData, tags })}
            presetOptions={['HR', 'Payroll', 'PCI-DSS', 'High-Risk', 'SaaS', 'GDPR-Art30']}
          />
        </form>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="recordForm"
            className="px-5 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create Record'}
          </button>
        </div>
      </div>
    </div>
  );
};
