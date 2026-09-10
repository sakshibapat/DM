import React, { useState } from 'react';
import { X, Plus, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { InventoryType } from '../../types/privacy';
import { usePrivacyData } from '../../context/PrivacyDataContext';

interface QuickCreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInventoryType: InventoryType;
  onCreated: (newRecordId: string) => void;
}

export const QuickCreateRecordModal: React.FC<QuickCreateRecordModalProps> = ({
  isOpen,
  onClose,
  targetInventoryType,
  onCreated,
}) => {
  const {
    addRecord,
    processingActivities,
    assets,
    vendors,
    tspReferences,
    entities,
  } = usePrivacyData();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customField, setCustomField] = useState(''); // Category, Jurisdiction, IT Owner, etc.
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getInventoryLabel = (type: InventoryType) => {
    switch (type) {
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

  const getCustomFieldLabel = (type: InventoryType) => {
    switch (type) {
      case 'processingActivities':
        return 'Processing Purpose / Role';
      case 'tspReferences':
        return 'Category / Platform Type';
      case 'assets':
        return 'Asset Type / Infrastructure';
      case 'vendors':
        return 'Headquarters / Location';
      case 'entities':
        return 'Jurisdiction / Country';
    }
  };

  // Check for duplicate names
  const existingRecords =
    targetInventoryType === 'processingActivities'
      ? processingActivities
      : targetInventoryType === 'assets'
      ? assets
      : targetInventoryType === 'vendors'
      ? vendors
      : targetInventoryType === 'tspReferences'
      ? tspReferences
      : entities;

  const duplicateMatch = name.trim()
    ? existingRecords.find(
        r => r.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    let payload: any = {
      name: name.trim(),
      description: description.trim(),
      status: 'Approved',
      createdBy: 'Current User',
      lastModifiedBy: 'Current User',
    };

    if (targetInventoryType === 'tspReferences') {
      payload = {
        ...payload,
        tspReference: `TSP-REF-${Math.floor(100 + Math.random() * 900)}`,
        category: customField.trim() || 'SaaS Application',
        versionOrPlan: 'Standard',
        vendorIds: [],
        assetIds: [],
        entityIds: [],
        processingActivityIds: [],
      };
    } else if (targetInventoryType === 'assets') {
      payload = {
        ...payload,
        assetType: customField.trim() || 'Database',
        managingOrganisation: 'Corporate IT',
        hostingType: 'Cloud',
        hostingProvider: 'AWS',
        primaryHostingLocation: 'United States',
        dataClassification: 'Confidential',
        itOwner: 'IT Admin',
        vendorIds: [],
        tspIds: [],
        processingActivityIds: [],
      };
    } else if (targetInventoryType === 'vendors') {
      payload = {
        ...payload,
        dpaStatus: 'Signed',
        headquarters: customField.trim() || 'Global',
        contactEmail: 'privacy@vendor.com',
        securityCertifications: ['ISO 27001'],
        assetIds: [],
        processingActivityIds: [],
        tspIds: [],
      };
    } else if (targetInventoryType === 'entities') {
      payload = {
        ...payload,
        jurisdiction: customField.trim() || 'EU - Netherlands',
        registrationNumber: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        dpoContact: 'dpo@company.com',
        processingActivityIds: [],
        assetIds: [],
        tspIds: [],
      };
    } else {
      payload = {
        ...payload,
        role: 'Controller',
        legalBasis: 'Legitimate Interest',
        owner: customField.trim() || 'Privacy Team',
        personalDataCategories: ['Contact Info'],
        tspIds: [],
        assetIds: [],
        vendorIds: [],
        entityIds: [],
      };
    }

    const newId = addRecord(targetInventoryType, payload);
    onCreated(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">
              Quick Create {getInventoryLabel(targetInventoryType)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Create a lightweight record to immediately link to your current form. You can enrich complete metadata details at any time later.
          </p>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Record Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder={`e.g. New ${getInventoryLabel(targetInventoryType)} Name`}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-900'
              }`}
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>

          {/* Duplicate Warning */}
          {duplicateMatch && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Potential Duplicate Warning</span>
                A record named <strong>"{duplicateMatch.name}"</strong> ({duplicateMatch.id}) already exists in {getInventoryLabel(targetInventoryType)}s.
              </div>
            </div>
          )}

          {/* Custom field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              {getCustomFieldLabel(targetInventoryType)}
            </label>
            <input
              type="text"
              value={customField}
              onChange={e => setCustomField(e.target.value)}
              placeholder="e.g. Primary Category or Key Information"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Brief Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create & Link
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
