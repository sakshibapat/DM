import React, { useState, useEffect } from 'react';
import { X, Save, Globe2, Network, AlertCircle, AlertTriangle } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { Entity, StatusType } from '../../types/privacy';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';
import { COUNTRY_LOCATION_LOOKUP } from '../../data/assetLookupCatalog';

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIdToEdit?: string | null;
}

const COMMON_JURISDICTIONS = [
  'EU - Netherlands',
  'EU - Germany',
  'EU - France',
  'EU - Ireland',
  'UK - England & Wales',
  'US - Delaware',
  'US - California',
  'US - New York',
  'Singapore',
  'Australia',
  'Japan',
  'Canada',
  'Switzerland',
  'Other',
];

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  onClose,
  recordIdToEdit,
}) => {
  const {
    entities,
    processingActivities,
    assets,
    tspReferences,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);

  // Form Fields
  const [name, setName] = useState('');
  const [jurisdiction, setJurisdiction] = useState(COMMON_JURISDICTIONS[0]);
  const [customJurisdiction, setCustomJurisdiction] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [dpoContact, setDpoContact] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StatusType>('Approved');

  // Relationship States
  const [processingActivityIds, setProcessingActivityIds] = useState<string[]>([]);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [tspIds, setTspIds] = useState<string[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships'>('overview');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      const existing = entities.find(e => e.id === recordIdToEdit);
      if (existing) {
        setName(existing.name || '');
        setRegistrationNumber(existing.registrationNumber || '');
        setDpoContact(existing.dpoContact || '');
        setAddress(existing.address || '');
        setDescription(existing.description || '');
        setStatus(existing.status || 'Approved');

        if (existing.jurisdiction && COMMON_JURISDICTIONS.includes(existing.jurisdiction)) {
          setJurisdiction(existing.jurisdiction);
          setCustomJurisdiction('');
        } else if (existing.jurisdiction) {
          setJurisdiction('Other');
          setCustomJurisdiction(existing.jurisdiction);
        } else {
          setJurisdiction(COMMON_JURISDICTIONS[0]);
        }

        // Compute PA relationships
        const linkedPaIds = existing.processingActivityIds || [];
        const reversePaIds = processingActivities
          .filter(pa => (pa.entityIds || []).includes(existing.id))
          .map(pa => pa.id);
        setProcessingActivityIds(Array.from(new Set([...linkedPaIds, ...reversePaIds])));

        // Compute Asset relationships
        setAssetIds(existing.assetIds || []);

        // Compute TSP relationships
        const linkedTspIds = existing.tspIds || [];
        const reverseTspIds = tspReferences
          .filter(t => (t.entityIds || []).includes(existing.id))
          .map(t => t.id);
        setTspIds(Array.from(new Set([...linkedTspIds, ...reverseTspIds])));
      }
    } else {
      setName('');
      setJurisdiction(COMMON_JURISDICTIONS[0]);
      setCustomJurisdiction('');
      setRegistrationNumber(`REG-${Math.floor(10000 + Math.random() * 90000)}`);
      setDpoContact('dpo@privacorp.com');
      setAddress('');
      setDescription('');
      setStatus('Approved');
      setProcessingActivityIds([]);
      setAssetIds([]);
      setTspIds([]);
      setErrors({});
    }
  }, [isOpen, isEdit, recordIdToEdit, entities, processingActivities, tspReferences]);

  if (!isOpen) return null;

  // Real-time duplicate check
  const duplicateMatch = name.trim()
    ? entities.find(
        e => e.id !== recordIdToEdit && e.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    : null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Entity Name is required';
    }
    if (jurisdiction === 'Other' && !customJurisdiction.trim()) {
      newErrors.jurisdiction = 'Custom Jurisdiction is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalJurisdiction = jurisdiction === 'Other' ? customJurisdiction.trim() : jurisdiction;

    const payload: Omit<Entity, 'id' | 'createdDate' | 'lastModifiedDate'> = {
      name: name.trim(),
      jurisdiction: finalJurisdiction,
      registrationNumber: registrationNumber.trim(),
      dpoContact: dpoContact.trim(),
      address: address.trim(),
      description: description.trim(),
      status,
      processingActivityIds,
      assetIds,
      tspIds,
      vendorIds: [],
      createdBy: 'Current User',
      lastModifiedBy: 'Current User',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('entities', recordIdToEdit, payload as Partial<Entity>);
    } else {
      addRecord('entities', payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit Legal Entity: ${name}` : 'Register New Legal Entity'}
              </h2>
              <p className="text-xs text-slate-500">
                Register corporate subsidiaries, group legal entities, and regional operating units.
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
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            1. Entity Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'relationships'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            2. Inventory Relationships ({processingActivityIds.length + assetIds.length + tspIds.length})
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
                    <span className="font-bold text-amber-950 block">Potential Duplicate Entity Warning</span>
                    An entity named <strong>"{duplicateMatch.name}"</strong> (ID: <code>{duplicateMatch.id}</code>) already exists. Please verify you are not creating a duplicate.
                  </div>
                </div>
              )}

              {/* Entity Name & Jurisdiction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Entity Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. PrivaCorp BV, PrivaCorp Inc."
                    className={`w-full px-3 py-2 text-sm rounded-md border ${
                      errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-purple-500'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Jurisdiction / Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={e => setJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {COMMON_JURISDICTIONS.map(jur => (
                      <option key={jur} value={jur}>
                        {jur}
                      </option>
                    ))}
                  </select>
                </div>

                {jurisdiction === 'Other' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Jurisdiction <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customJurisdiction}
                      onChange={e => setCustomJurisdiction(e.target.value)}
                      placeholder="e.g. Brazil - São Paulo"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.jurisdiction && <p className="text-xs text-rose-600 mt-1">{errors.jurisdiction}</p>}
                  </div>
                )}
              </div>

              {/* Registration #, DPO Contact, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Company Registration #
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. KVK-84920194"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    DPO / Privacy Contact Email
                  </label>
                  <input
                    type="email"
                    value={dpoContact}
                    onChange={e => setDpoContact(e.target.value)}
                    placeholder="dpo@company.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as StatusType)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Registered Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Official Registered Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Keizersgracht 421, 1016 EK Amsterdam, Netherlands"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Entity Purpose & Operations Overview
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Operational scope, corporate relationship, data controller role details..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: RELATIONSHIPS */}
          {activeTab === 'relationships' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-950 leading-relaxed">
                Connect this entity to related Processing Activities, Assets, and TSP references. Linking entities allows flexible multi-entity compliance representation without altering processing activity definitions.
              </div>

              {/* Connected Processing Activities */}
              <SearchableRelationshipSelector
                label="Related Processing Activities"
                targetInventoryType="processingActivities"
                availableItems={processingActivities}
                selectedIds={processingActivityIds}
                onChange={setProcessingActivityIds}
                helperText="Processing activities conducted or controlled by this legal entity."
              />

              {/* Connected Assets */}
              <SearchableRelationshipSelector
                label="Related Systems & Assets"
                targetInventoryType="assets"
                availableItems={assets}
                selectedIds={assetIds}
                onChange={setAssetIds}
                helperText="Infrastructure assets, databases, or systems owned by this entity."
              />

              {/* Connected TSPs */}
              <SearchableRelationshipSelector
                label="Related TSP / Product References"
                targetInventoryType="tspReferences"
                availableItems={tspReferences}
                selectedIds={tspIds}
                onChange={setTspIds}
                helperText="Technical products licensed or managed under this entity."
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
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-2xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Entity' : 'Save Entity'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
