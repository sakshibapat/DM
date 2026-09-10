import React, { useState, useEffect } from 'react';
import { X, Save, Server, Shield, Network, Building2, Check, AlertCircle } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { Asset, StatusType, DataClassification, TSPStatusOption } from '../../types/privacy';
import { SecurityMeasuresSection } from '../common/SecurityMeasuresSection';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';
import {
  MANAGING_ORGANISATION_OPTIONS,
  ASSET_TYPE_OPTIONS,
  HOSTING_TYPE_OPTIONS,
  HOSTING_PROVIDER_OPTIONS,
  COUNTRY_LOCATION_LOOKUP,
} from '../../data/assetLookupCatalog';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIdToEdit?: string | null;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  recordIdToEdit,
}) => {
  const {
    assets,
    processingActivities,
    vendors,
    tspReferences,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);

  // Form state fields
  const [name, setName] = useState('');
  const [managingOrganisation, setManagingOrganisation] = useState<string>(MANAGING_ORGANISATION_OPTIONS[0]);
  const [customManagingOrganisation, setCustomManagingOrganisation] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState<string>(ASSET_TYPE_OPTIONS[0]);
  const [customAssetType, setCustomAssetType] = useState('');
  const [hostingType, setHostingType] = useState<string>(HOSTING_TYPE_OPTIONS[0]);
  const [customHostingType, setCustomHostingType] = useState('');
  const [hostingProvider, setHostingProvider] = useState<string>(HOSTING_PROVIDER_OPTIONS[0]);
  const [customHostingProvider, setCustomHostingProvider] = useState('');
  const [primaryHostingLocation, setPrimaryHostingLocation] = useState<string>(COUNTRY_LOCATION_LOOKUP[0]);
  const [additionalHostingLocations, setAdditionalHostingLocations] = useState<string[]>([]);
  const [itOwner, setItOwner] = useState('');
  const [status, setStatus] = useState<StatusType>('Approved');
  const [dataClassification, setDataClassification] = useState<DataClassification>('Confidential');

  // Security Measures State (Reusable TOM Component State)
  const [tspStatus, setTspStatus] = useState<TSPStatusOption>('Yes');
  const [tspJustification, setTspJustification] = useState('');
  const [toms, setToms] = useState<string[]>(['Encryption at rest', 'Encryption in transit']);
  const [tomsOther, setTomsOther] = useState('');

  // Relationship state
  const [processingActivityIds, setProcessingActivityIds] = useState<string[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [tspIds, setTspIds] = useState<string[]>([]);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<'overview' | 'hosting' | 'security' | 'relationships'>('overview');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate data when editing an existing Asset
  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      const existing = assets.find(a => a.id === recordIdToEdit);
      if (existing) {
        setName(existing.name || '');
        setDescription(existing.description || '');
        setItOwner(existing.itOwner || existing.owner || '');
        setStatus(existing.status || 'Approved');
        setDataClassification(existing.dataClassification || 'Confidential');

        // Managing Org lookup vs custom
        if (existing.managingOrganisation && MANAGING_ORGANISATION_OPTIONS.includes(existing.managingOrganisation as any)) {
          setManagingOrganisation(existing.managingOrganisation);
          setCustomManagingOrganisation('');
        } else if (existing.managingOrganisation) {
          setManagingOrganisation('Other');
          setCustomManagingOrganisation(existing.managingOrganisation);
        } else {
          setManagingOrganisation(MANAGING_ORGANISATION_OPTIONS[0]);
        }

        // Asset Type lookup vs custom
        if (existing.assetType && ASSET_TYPE_OPTIONS.includes(existing.assetType as any)) {
          setAssetType(existing.assetType);
          setCustomAssetType('');
        } else if (existing.assetType) {
          setAssetType('Other');
          setCustomAssetType(existing.assetType);
        } else {
          setAssetType(ASSET_TYPE_OPTIONS[0]);
        }

        // Hosting Type lookup vs custom
        if (existing.hostingType && HOSTING_TYPE_OPTIONS.includes(existing.hostingType as any)) {
          setHostingType(existing.hostingType);
          setCustomHostingType('');
        } else if (existing.hostingType) {
          setHostingType('Other');
          setCustomHostingType(existing.hostingType);
        } else {
          setHostingType(HOSTING_TYPE_OPTIONS[0]);
        }

        // Hosting Provider lookup vs custom
        if (existing.hostingProvider && HOSTING_PROVIDER_OPTIONS.includes(existing.hostingProvider as any)) {
          setHostingProvider(existing.hostingProvider);
          setCustomHostingProvider('');
        } else if (existing.hostingProvider) {
          setHostingProvider('Other');
          setCustomHostingProvider(existing.hostingProvider);
        } else {
          setHostingProvider(HOSTING_PROVIDER_OPTIONS[0]);
        }

        // Locations
        setPrimaryHostingLocation(existing.primaryHostingLocation || COUNTRY_LOCATION_LOOKUP[0]);
        setAdditionalHostingLocations(existing.additionalHostingLocations || []);

        // TOMs & Security
        setTspStatus((existing.tspStatus as TSPStatusOption) || 'Yes');
        setTspJustification(existing.tspJustification || '');
        setToms(existing.toms || []);
        setTomsOther(existing.tomsOther || '');

        // Relationships
        setVendorIds(existing.vendorIds || []);
        setTspIds(existing.tspIds || []);

        // Compute PA relationships connected to this asset
        const linkedPaIds = existing.processingActivityIds || [];
        const reversePaIds = processingActivities
          .filter(pa => (pa.assetIds || []).includes(existing.id))
          .map(pa => pa.id);
        const combinedPaIds = Array.from(new Set([...linkedPaIds, ...reversePaIds]));
        setProcessingActivityIds(combinedPaIds);
      }
    } else {
      // Reset form defaults for new record
      setName('');
      setDescription('');
      setManagingOrganisation(MANAGING_ORGANISATION_OPTIONS[0]);
      setCustomManagingOrganisation('');
      setAssetType(ASSET_TYPE_OPTIONS[0]);
      setCustomAssetType('');
      setHostingType(HOSTING_TYPE_OPTIONS[0]);
      setCustomHostingType('');
      setHostingProvider(HOSTING_PROVIDER_OPTIONS[0]);
      setCustomHostingProvider('');
      setPrimaryHostingLocation(COUNTRY_LOCATION_LOOKUP[0]);
      setAdditionalHostingLocations([]);
      setItOwner('');
      setStatus('Approved');
      setDataClassification('Confidential');
      setTspStatus('Yes');
      setTspJustification('');
      setToms(['Encryption at rest', 'Encryption in transit', 'Role Based Access Controls']);
      setTomsOther('');
      setProcessingActivityIds([]);
      setVendorIds([]);
      setTspIds([]);
      setErrors({});
    }
  }, [isOpen, isEdit, recordIdToEdit, assets, processingActivities]);

  if (!isOpen) return null;

  // Filter available options for additional hosting locations to exclude primary location
  const availableAdditionalLocations = COUNTRY_LOCATION_LOOKUP.filter(
    loc => loc !== primaryHostingLocation
  );

  const handlePrimaryLocationChange = (newPrimaryLoc: string) => {
    setPrimaryHostingLocation(newPrimaryLoc);
    // Remove selected primary location from additional locations if present
    if (additionalHostingLocations.includes(newPrimaryLoc)) {
      setAdditionalHostingLocations(prev => prev.filter(l => l !== newPrimaryLoc));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Asset Name is required';
    }

    if (managingOrganisation === 'Other' && !customManagingOrganisation.trim()) {
      newErrors.managingOrganisation = 'Please specify custom Managing Organisation';
    }

    if (assetType === 'Other' && !customAssetType.trim()) {
      newErrors.assetType = 'Please specify custom Asset Type';
    }

    if (hostingType === 'Other' && !customHostingType.trim()) {
      newErrors.hostingType = 'Please specify custom Hosting Type';
    }

    if (hostingProvider === 'Other' && !customHostingProvider.trim()) {
      newErrors.hostingProvider = 'Please specify custom Hosting Provider';
    }

    if (!primaryHostingLocation) {
      newErrors.primaryHostingLocation = 'Primary Hosting Location is required';
    }

    if (tspStatus === 'N/A' && !tspJustification.trim()) {
      newErrors.tspJustification = 'Justification is required when TSP registration is N/A';
    }

    if (toms.includes('Other') && !tomsOther.trim()) {
      newErrors.tomsOther = 'Description is required when Other TOM control is selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalManagingOrg = managingOrganisation === 'Other' ? customManagingOrganisation : managingOrganisation;
    const finalAssetType = assetType === 'Other' ? customAssetType : assetType;
    const finalHostingType = hostingType === 'Other' ? customHostingType : hostingType;
    const finalHostingProvider = hostingProvider === 'Other' ? customHostingProvider : hostingProvider;

    const payload: Omit<Asset, 'id' | 'createdDate' | 'lastModifiedDate'> = {
      name: name.trim(),
      description: description.trim(),
      managingOrganisation: finalManagingOrg,
      assetType: finalAssetType as any,
      hostingType: finalHostingType,
      hostingProvider: finalHostingProvider,
      primaryHostingLocation,
      additionalHostingLocations: additionalHostingLocations.filter(loc => loc !== primaryHostingLocation),
      hostingLocation: `${finalHostingProvider} (${primaryHostingLocation})`,
      itOwner: itOwner.trim(),
      owner: itOwner.trim(),
      status,
      dataClassification,
      tspStatus,
      tspJustification: tspStatus === 'N/A' ? tspJustification.trim() : '',
      toms,
      tomsOther: toms.includes('Other') ? tomsOther.trim() : '',
      processingActivityIds,
      vendorIds,
      tspIds,
      createdBy: 'Current User',
      lastModifiedBy: 'Current User',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('assets', recordIdToEdit, payload as Partial<Asset>);
    } else {
      addRecord('assets', payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit Asset: ${name || recordIdToEdit}` : 'Register New Asset'}
              </h2>
              <p className="text-xs text-slate-500">
                System, application, database, storage bucket, or physical asset record.
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

        {/* Section Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            1. Asset Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hosting')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'hosting'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            2. Hosting & Infrastructure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            3. Security Measures (TOMs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relationships')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'relationships'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            4. Inventory Relationships ({processingActivityIds.length + vendorIds.length + tspIds.length})
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Asset Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Customer Relationship Management Database"
                  className={`w-full px-3 py-2 text-sm rounded-md border ${
                    errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              {/* Managing Organisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Managing Organisation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={managingOrganisation}
                    onChange={e => setManagingOrganisation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {MANAGING_ORGANISATION_OPTIONS.map(org => (
                      <option key={org} value={org}>
                        {org}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Organisation)</option>
                  </select>
                </div>

                {managingOrganisation === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Organisation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customManagingOrganisation}
                      onChange={e => setCustomManagingOrganisation(e.target.value)}
                      placeholder="Enter custom organisation name"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.managingOrganisation && (
                      <p className="text-xs text-rose-600 mt-1">{errors.managingOrganisation}</p>
                    )}
                  </div>
                )}

                {/* Asset Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Asset Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assetType}
                    onChange={e => setAssetType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ASSET_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Asset Type)</option>
                  </select>
                </div>

                {assetType === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Asset Type <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customAssetType}
                      onChange={e => setCustomAssetType(e.target.value)}
                      placeholder="Enter custom asset type"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.assetType && (
                      <p className="text-xs text-rose-600 mt-1">{errors.assetType}</p>
                    )}
                  </div>
                )}
              </div>

              {/* IT Owner & Status & Data Classification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    IT Owner / System Custodian
                  </label>
                  <input
                    type="text"
                    value={itOwner}
                    onChange={e => setItOwner(e.target.value)}
                    placeholder="e.g. John Doe (Lead IT Admin)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as StatusType)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Data Classification
                  </label>
                  <select
                    value={dataClassification}
                    onChange={e => setDataClassification(e.target.value as DataClassification)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Restricted">Restricted (Highest Sensitivity)</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Internal">Internal Use Only</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Asset Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed description of the asset function, stored data categories, architecture, and purpose..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: HOSTING & INFRASTRUCTURE */}
          {activeTab === 'hosting' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
                Configure primary infrastructure attributes, hosting architecture model, cloud provider, and hosting geographic locations.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hosting Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Hosting Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={hostingType}
                    onChange={e => setHostingType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {HOSTING_TYPE_OPTIONS.map(ht => (
                      <option key={ht} value={ht}>
                        {ht}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Hosting Type)</option>
                  </select>
                </div>

                {hostingType === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Hosting Type <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customHostingType}
                      onChange={e => setCustomHostingType(e.target.value)}
                      placeholder="Enter custom hosting type"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.hostingType && (
                      <p className="text-xs text-rose-600 mt-1">{errors.hostingType}</p>
                    )}
                  </div>
                )}

                {/* Hosting Provider */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Hosting Provider <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={hostingProvider}
                    onChange={e => setHostingProvider(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {HOSTING_PROVIDER_OPTIONS.map(hp => (
                      <option key={hp} value={hp}>
                        {hp}
                      </option>
                    ))}
                    <option value="Other">Other (Custom Hosting Provider)</option>
                  </select>
                </div>

                {hostingProvider === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Specify Custom Hosting Provider <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customHostingProvider}
                      onChange={e => setCustomHostingProvider(e.target.value)}
                      placeholder="Enter custom hosting provider"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.hostingProvider && (
                      <p className="text-xs text-rose-600 mt-1">{errors.hostingProvider}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Hosting Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Hosting Location <span className="text-rose-500">*</span>
                </label>
                <select
                  value={primaryHostingLocation}
                  onChange={e => handlePrimaryLocationChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COUNTRY_LOCATION_LOOKUP.map(loc => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Centrally managed primary jurisdiction or country where primary storage/servers reside.
                </p>
              </div>

              {/* Additional Hosting Locations */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Additional Hosting Locations (Multi-Select)
                </label>
                <div className="border border-slate-300 rounded-md p-3 bg-slate-50/50 space-y-2">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {additionalHostingLocations.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No secondary locations selected</span>
                    ) : (
                      additionalHostingLocations.map(loc => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200"
                        >
                          {loc}
                          <button
                            type="button"
                            onClick={() =>
                              setAdditionalHostingLocations(prev => prev.filter(l => l !== loc))
                            }
                            className="hover:text-emerald-950 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 max-h-48 overflow-y-auto">
                    {availableAdditionalLocations.map(loc => {
                      const isSelected = additionalHostingLocations.includes(loc);
                      return (
                        <label
                          key={loc}
                          className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer border transition ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setAdditionalHostingLocations(prev => prev.filter(l => l !== loc));
                              } else {
                                setAdditionalHostingLocations(prev => [...prev, loc]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="truncate">{loc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Primary location ({primaryHostingLocation}) is excluded from additional locations automatically to avoid redundant duplication.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY MEASURES (TOMs) */}
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

          {/* TAB 4: RELATIONSHIPS */}
          {activeTab === 'relationships' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Establish bidirectional links to Processing Activities, Vendors, and TSP/Product references. Relationships are synchronized automatically across all linked inventories.
              </div>

              {/* Related Processing Activities */}
              <SearchableRelationshipSelector
                label="Related Processing Activities"
                targetInventoryType="processingActivities"
                availableItems={processingActivities}
                selectedIds={processingActivityIds}
                onChange={setProcessingActivityIds}
                helperText="Processing activities that store, process, or transmit data through this asset."
              />

              {/* Related Vendors */}
              <SearchableRelationshipSelector
                label="Related Vendors & Processors"
                targetInventoryType="vendors"
                availableItems={vendors}
                selectedIds={vendorIds}
                onChange={setVendorIds}
                helperText="Third-party vendor entities maintaining or operating this asset infrastructure."
              />

              {/* Related TSP / Product References */}
              <SearchableRelationshipSelector
                label="Related TSP / Product References"
                targetInventoryType="tspReferences"
                availableItems={tspReferences}
                selectedIds={tspIds}
                onChange={setTspIds}
                helperText="Technology platforms or product references associated with this asset."
              />
            </div>
          )}

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {Object.keys(errors).length > 0 && (
              <span className="text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-4 h-4" /> Please fix validation errors before saving.
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
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Asset Record' : 'Save Asset Record'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
