import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ProcessingActivity,
  TSPReference,
  Asset,
  Vendor,
  Entity,
  InventoryType,
  AttentionItem,
  AuditLogEntry,
  DataMappingMetrics,
  PrivacyRecord,
} from '../types/privacy';
import {
  loadDataStore,
  saveDataStore,
  resetToDemoStore,
} from '../utils/storageRepository';

interface PrivacyDataContextType {
  processingActivities: ProcessingActivity[];
  tspReferences: TSPReference[];
  assets: Asset[];
  vendors: Vendor[];
  entities: Entity[];
  auditLogs: AuditLogEntry[];
  
  // Navigation State
  activeNav: string; // 'dashboard' | 'processingActivities' | 'tspReferences' | 'assets' | 'vendors' | 'entities' | 'future-assessments' | ...
  setActiveNav: (nav: string) => void;
  
  // Selected record drawer state
  selectedRecord: { id: string; type: InventoryType } | null;
  setSelectedRecord: (record: { id: string; type: InventoryType } | null) => void;
  
  // Global Search & Filters
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  
  // CRUD Actions
  addRecord: (inventoryType: InventoryType, recordData: Omit<PrivacyRecord, 'id' | 'createdDate' | 'lastModifiedDate'>) => string;
  updateRecord: (inventoryType: InventoryType, id: string, recordData: Partial<PrivacyRecord>) => void;
  deleteRecord: (inventoryType: InventoryType, id: string) => void;
  duplicateRecord: (inventoryType: InventoryType, id: string) => void;
  
  // Bidirectional Relationship Helpers
  getRelatedRecords: (id: string, type: InventoryType) => {
    processingActivities: ProcessingActivity[];
    tspReferences: TSPReference[];
    assets: Asset[];
    vendors: Vendor[];
    entities: Entity[];
  };
  
  // Attention & Metrics
  attentionItems: AttentionItem[];
  metrics: DataMappingMetrics;
  
  // Admin / State management
  resetToDefaultData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
}

const PrivacyDataContext = createContext<PrivacyDataContextType | undefined>(undefined);

export const PrivacyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [selectedRecord, setSelectedRecord] = useState<{ id: string; type: InventoryType } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Load unified data store on component creation
  const initialData = useMemo(() => loadDataStore(), []);

  // Main inventories state
  const [processingActivities, setProcessingActivities] = useState<ProcessingActivity[]>(initialData.processingActivities);
  const [tspReferences, setTspReferences] = useState<TSPReference[]>(initialData.tspReferences);
  const [assets, setAssets] = useState<Asset[]>(initialData.assets);
  const [vendors, setVendors] = useState<Vendor[]>(initialData.vendors);
  const [entities, setEntities] = useState<Entity[]>(initialData.entities);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialData.auditLogs);

  // Save state to Local Storage
  useEffect(() => {
    const storePayload = {
      processingActivities,
      tspReferences,
      assets,
      vendors,
      entities,
      auditLogs,
    };
    saveDataStore(storePayload);
  }, [processingActivities, tspReferences, assets, vendors, entities, auditLogs]);

  // Compute Bidirectional Relationships dynamically
  const getRelatedRecords = useMemo(() => {
    return (id: string, type: InventoryType) => {
      const relatedPAs: ProcessingActivity[] = [];
      const relatedTSPs: TSPReference[] = [];
      const relatedAssets: Asset[] = [];
      const relatedVendors: Vendor[] = [];
      const relatedEntities: Entity[] = [];

      if (type === 'processingActivities') {
        const pa = processingActivities.find(item => item.id === id);
        if (pa) {
          // TSPs
          (pa.tspIds || []).forEach(tspId => {
            const match = tspReferences.find(t => t.id === tspId);
            if (match && !relatedTSPs.some(x => x.id === match.id)) relatedTSPs.push(match);
          });
          // Assets (check pa.assetIds and asset.processingActivityIds)
          (pa.assetIds || []).forEach(astId => {
            const match = assets.find(a => a.id === astId);
            if (match && !relatedAssets.some(x => x.id === match.id)) relatedAssets.push(match);
          });
          (pa.dataSourceAssetIds || []).forEach(astId => {
            const match = assets.find(a => a.id === astId);
            if (match && !relatedAssets.some(x => x.id === match.id)) relatedAssets.push(match);
          });
          (pa.dataDestinationAssetIds || []).forEach(astId => {
            const match = assets.find(a => a.id === astId);
            if (match && !relatedAssets.some(x => x.id === match.id)) relatedAssets.push(match);
          });
          assets.forEach(a => {
            if ((a.processingActivityIds || []).includes(id) && !relatedAssets.some(x => x.id === a.id)) {
              relatedAssets.push(a);
            }
          });
          // Vendors
          (pa.vendorIds || []).forEach(vId => {
            const match = vendors.find(v => v.id === vId);
            if (match && !relatedVendors.some(x => x.id === match.id)) relatedVendors.push(match);
          });
          // Entities
          (pa.entityIds || []).forEach(eId => {
            const match = entities.find(e => e.id === eId);
            if (match && !relatedEntities.some(x => x.id === match.id)) relatedEntities.push(match);
          });
        }
      } else if (type === 'tspReferences') {
        const tsp = tspReferences.find(item => item.id === id);
        if (tsp) {
          // PAs referencing this TSP
          processingActivities.forEach(pa => {
            if ((pa.tspIds || []).includes(id) && !relatedPAs.some(x => x.id === pa.id)) {
              relatedPAs.push(pa);
            }
          });
          // Direct Assets
          (tsp.assetIds || []).forEach(astId => {
            const match = assets.find(a => a.id === astId);
            if (match && !relatedAssets.some(x => x.id === match.id)) relatedAssets.push(match);
          });
          assets.forEach(a => {
            if ((a.tspIds || []).includes(id) && !relatedAssets.some(x => x.id === a.id)) {
              relatedAssets.push(a);
            }
          });
          // Direct Vendors
          (tsp.vendorIds || []).forEach(vId => {
            const match = vendors.find(v => v.id === vId);
            if (match && !relatedVendors.some(x => x.id === match.id)) relatedVendors.push(match);
          });
          // Direct Entities
          (tsp.entityIds || []).forEach(eId => {
            const match = entities.find(e => e.id === eId);
            if (match && !relatedEntities.some(x => x.id === match.id)) relatedEntities.push(match);
          });
        }
      } else if (type === 'assets') {
        const ast = assets.find(item => item.id === id);
        if (ast) {
          // PAs referencing this Asset directly or via ast.processingActivityIds
          processingActivities.forEach(pa => {
            if (((pa.assetIds || []).includes(id) || (pa.dataSourceAssetIds || []).includes(id) || (pa.dataDestinationAssetIds || []).includes(id) || (ast.processingActivityIds || []).includes(pa.id)) && !relatedPAs.some(x => x.id === pa.id)) {
              relatedPAs.push(pa);
            }
          });
          // TSPs referencing or linked to this Asset
          tspReferences.forEach(t => {
            if (((t.assetIds || []).includes(id) || (ast.tspIds || []).includes(t.id)) && !relatedTSPs.some(x => x.id === t.id)) {
              relatedTSPs.push(t);
            }
          });
          // Vendors linked to this Asset
          (ast.vendorIds || []).forEach(vId => {
            const match = vendors.find(v => v.id === vId);
            if (match && !relatedVendors.some(x => x.id === match.id)) relatedVendors.push(match);
          });
          // Vendors who have assetIds containing this asset
          vendors.forEach(v => {
            if ((v.assetIds || []).includes(id) && !relatedVendors.some(x => x.id === v.id)) {
              relatedVendors.push(v);
            }
          });
        }
      } else if (type === 'vendors') {
        const v = vendors.find(item => item.id === id);
        if (v) {
          // Related Assets
          (v.assetIds || []).forEach(astId => {
            const match = assets.find(a => a.id === astId);
            if (match && !relatedAssets.some(x => x.id === match.id)) relatedAssets.push(match);
          });
          assets.forEach(a => {
            if ((a.vendorIds || []).includes(id) && !relatedAssets.some(x => x.id === a.id)) {
              relatedAssets.push(a);
            }
          });
          // Related PAs
          processingActivities.forEach(pa => {
            if ((pa.vendorIds || []).includes(id) && !relatedPAs.some(x => x.id === pa.id)) {
              relatedPAs.push(pa);
            }
          });
          // TSPs by vendor
          tspReferences.forEach(t => {
            if ((t.vendorIds || []).includes(id) && !relatedTSPs.some(x => x.id === t.id)) {
              relatedTSPs.push(t);
            }
          });
        }
      } else if (type === 'entities') {
        const ent = entities.find(item => item.id === id);
        if (ent) {
          // Related PAs
          processingActivities.forEach(pa => {
            if ((pa.entityIds || []).includes(id) && !relatedPAs.some(x => x.id === pa.id)) {
              relatedPAs.push(pa);
            }
          });
          // TSPs
          tspReferences.forEach(t => {
            if ((t.entityIds || []).includes(id) && !relatedTSPs.some(x => x.id === t.id)) {
              relatedTSPs.push(t);
            }
          });
        }
      }

      return {
        processingActivities: relatedPAs,
        tspReferences: relatedTSPs,
        assets: relatedAssets,
        vendors: relatedVendors,
        entities: relatedEntities,
      };
    };
  }, [processingActivities, tspReferences, assets, vendors, entities]);

  // Compute Attention / Data Quality Items
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const list: AttentionItem[] = [];

    // Check Processing Activities
    processingActivities.forEach(pa => {
      if (pa.status === 'Archived') return;

      // 1. Missing retention
      if (pa.retentionPolicyType === 'None' || !pa.hasRetentionPolicy || !pa.retentionPeriod || pa.retentionPeriod.trim() === '' || pa.retentionPeriod === 'None') {
        list.push({
          id: `att-ret-${pa.id}`,
          recordId: pa.id,
          recordName: pa.name,
          inventoryType: 'processingActivities',
          issueType: 'Missing retention',
          severity: 'high',
          description: 'No defined data retention schedule or policy.',
        });
      }

      // 2. Missing legal basis where required
      const isControllerRole = pa.role === 'Controller' || pa.role === 'Joint Controller';
      if (isControllerRole) {
        if (!pa.legalBasis || pa.legalBasis.trim() === '') {
          list.push({
            id: `att-leg-${pa.id}`,
            recordId: pa.id,
            recordName: pa.name,
            inventoryType: 'processingActivities',
            issueType: 'Missing legal basis',
            severity: 'high',
            description: 'GDPR/Privacy Art 6 legal basis for controller processing is missing.',
          });
        } else if ((pa.legalBasis.includes('Legitimate Interest')) && !pa.liaFiled) {
          // 3. Legitimate Interest without confirmed LIA
          list.push({
            id: `att-lia-${pa.id}`,
            recordId: pa.id,
            recordName: pa.name,
            inventoryType: 'processingActivities',
            issueType: 'LIA unconfirmed',
            severity: 'medium',
            description: 'Legitimate Interest selected but LIA has not been confirmed.',
          });
        }
      }

      // 4. International transfer without safeguard
      if (pa.hasInternationalTransfer === 'Yes') {
        if (!pa.transferSafeguards || pa.transferSafeguards === 'None' || pa.transferSafeguards.trim() === '') {
          list.push({
            id: `att-tsf-${pa.id}`,
            recordId: pa.id,
            recordName: pa.name,
            inventoryType: 'processingActivities',
            issueType: 'International transfer without safeguard',
            severity: 'high',
            description: 'Cross-border data transfer safeguard (SCCs, DPF, BCR) is missing or unconfigured.',
          });
        }
      }

      // 5. Missing Business Process Owner
      if (!pa.owner || pa.owner.trim() === '') {
        list.push({
          id: `att-own-${pa.id}`,
          recordId: pa.id,
          recordName: pa.name,
          inventoryType: 'processingActivities',
          issueType: 'Missing Business Process Owner',
          severity: 'medium',
          description: 'No business process owner or business lead assigned to this activity.',
        });
      }

      // 6. Missing TOM information
      if (!pa.toms || pa.toms.length === 0) {
        list.push({
          id: `att-tom-${pa.id}`,
          recordId: pa.id,
          recordName: pa.name,
          inventoryType: 'processingActivities',
          issueType: 'Missing TOM information',
          severity: 'high',
          description: 'Technical & Organizational Security Measures (TOMs) are unlisted.',
        });
      }

      // 7. TSP registration pending
      if (pa.tspStatus === 'Pending') {
        list.push({
          id: `att-tspp-${pa.id}`,
          recordId: pa.id,
          recordName: pa.name,
          inventoryType: 'processingActivities',
          issueType: 'TSP registration pending',
          severity: 'medium',
          description: 'Trimble Security Profile (TSP) registration status is currently Pending.',
        });
      }

      // 8. Incomplete required fields
      if (!pa.description || pa.description.trim() === '' || !pa.dataSubjectCategories || pa.dataSubjectCategories.length === 0 || !pa.personalDataCategories || pa.personalDataCategories.length === 0) {
        list.push({
          id: `att-inc-${pa.id}`,
          recordId: pa.id,
          recordName: pa.name,
          inventoryType: 'processingActivities',
          issueType: 'Incomplete required fields',
          severity: 'low',
          description: 'Basic metadata, description, data subject types, or data categories are empty.',
        });
      }
    });

    // Check Assets
    assets.forEach(ast => {
      if (ast.status === 'Archived') return;

      // Missing Business Process Owner / IT Owner
      if ((!ast.owner || ast.owner.trim() === '') && (!ast.itOwner || ast.itOwner.trim() === '')) {
        list.push({
          id: `att-ast-own-${ast.id}`,
          recordId: ast.id,
          recordName: ast.name,
          inventoryType: 'assets',
          issueType: 'Missing Business Process Owner',
          severity: 'medium',
          description: 'System asset lacks designated Business Process Owner or IT custodian.',
        });
      }

      // Missing TOM information
      if (!ast.toms || ast.toms.length === 0) {
        list.push({
          id: `att-ast-tom-${ast.id}`,
          recordId: ast.id,
          recordName: ast.name,
          inventoryType: 'assets',
          issueType: 'Missing TOM information',
          severity: 'medium',
          description: 'Asset has no Technical & Organizational Security Measures (TOMs) listed.',
        });
      }

      // TSP registration pending
      if (ast.tspStatus === 'Pending') {
        list.push({
          id: `att-ast-tspp-${ast.id}`,
          recordId: ast.id,
          recordName: ast.name,
          inventoryType: 'assets',
          issueType: 'TSP registration pending',
          severity: 'medium',
          description: 'System Trimble Security Profile (TSP) registration status is currently Pending.',
        });
      }

      // Incomplete required fields
      if (!ast.assetType || !ast.managingOrganisation || !ast.primaryHostingLocation) {
        list.push({
          id: `att-ast-inc-${ast.id}`,
          recordId: ast.id,
          recordName: ast.name,
          inventoryType: 'assets',
          issueType: 'Incomplete required fields',
          severity: 'low',
          description: 'Asset is missing asset type, managing organisation, or primary hosting location.',
        });
      }
    });

    // Check Vendors
    vendors.forEach(v => {
      if (v.status === 'Archived') return;

      // Missing Business Process Owner
      if (!v.privacyContact || v.privacyContact.trim() === '') {
        list.push({
          id: `att-vnd-own-${v.id}`,
          recordId: v.id,
          recordName: v.name,
          inventoryType: 'vendors',
          issueType: 'Missing Business Process Owner',
          severity: 'medium',
          description: 'Vendor lacks designated internal business contact or privacy contact.',
        });
      }

      // Missing TOM information
      if (!v.toms || v.toms.length === 0) {
        list.push({
          id: `att-vnd-tom-${v.id}`,
          recordId: v.id,
          recordName: v.name,
          inventoryType: 'vendors',
          issueType: 'Missing TOM information',
          severity: 'medium',
          description: 'Vendor has no Technical & Organizational Security Measures (TOMs) documented.',
        });
      }

      // Incomplete required fields / DPA Warnings
      if (v.dpaStatus === 'In Review' || v.dpaStatus === 'Not Required' || v.dpaStatus === 'Expired') {
        list.push({
          id: `att-vnd-dpa-${v.id}`,
          recordId: v.id,
          recordName: v.name,
          inventoryType: 'vendors',
          issueType: 'Incomplete required fields',
          severity: v.dpaStatus === 'Expired' ? 'high' : 'medium',
          description: `Vendor Data Processing Agreement (DPA) status is currently '${v.dpaStatus}'.`,
        });
      }
    });

    // Check Legal Entities
    entities.forEach(e => {
      if (e.status === 'Archived') return;

      // Missing Business Process Owner / DPO
      if (!e.dpoContact || e.dpoContact.trim() === '') {
        list.push({
          id: `att-ent-own-${e.id}`,
          recordId: e.id,
          recordName: e.name,
          inventoryType: 'entities',
          issueType: 'Missing Business Process Owner',
          severity: 'medium',
          description: 'Legal entity does not have a designated DPO contact or regulatory lead.',
        });
      }

      // Incomplete required fields
      if (!e.jurisdiction || !e.headquarters) {
        list.push({
          id: `att-ent-inc-${e.id}`,
          recordId: e.id,
          recordName: e.name,
          inventoryType: 'entities',
          issueType: 'Incomplete required fields',
          severity: 'low',
          description: 'Legal entity lacks specified regulatory jurisdiction or headquarters location.',
        });
      }
    });

    // Check TSP references
    tspReferences.forEach(tsp => {
      if (tsp.status === 'Archived') return;

      if (!tsp.businessProcessOwner || tsp.businessProcessOwner.trim() === '') {
        list.push({
          id: `att-tsp-own-${tsp.id}`,
          recordId: tsp.id,
          recordName: tsp.name,
          inventoryType: 'tspReferences',
          issueType: 'Missing Business Process Owner',
          severity: 'medium',
          description: 'TSP reference lacks specified product business process owner.',
        });
      }
    });

    return list;
  }, [processingActivities, assets, vendors, entities, tspReferences]);

  // Compute Overall Metrics
  const metrics = useMemo<DataMappingMetrics>(() => {
    const totalProcessingActivities = processingActivities.length;
    const totalAssets = assets.length;
    const totalVendors = vendors.length;
    const totalEntities = entities.length;
    const totalTSPs = tspReferences.length;

    const controllerActivitiesCount = processingActivities.filter(pa => pa.role === 'Controller').length;
    const processorActivitiesCount = processingActivities.filter(pa => pa.role === 'Processor').length;
    const jointControllerActivitiesCount = processingActivities.filter(pa => pa.role === 'Joint Controller').length;

    const recordsMissingRetention = processingActivities.filter(
      pa => !pa.hasRetentionPolicy || !pa.retentionPeriod || pa.retentionPeriod.trim() === ''
    ).length;

    const recordsHighRisk = processingActivities.filter(pa => pa.involvesHighRiskData).length;

    return {
      totalProcessingActivities,
      totalAssets,
      totalVendors,
      totalEntities,
      totalTSPs,
      controllerActivitiesCount,
      processorActivitiesCount,
      jointControllerActivitiesCount,
      recordsMissingRetention,
      recordsHighRisk,
      attentionItemsCount: attentionItems.length,
    };
  }, [processingActivities, assets, vendors, entities, tspReferences, attentionItems]);

  // Helper to append audit entry
  const addAuditLog = (
    action: AuditLogEntry['action'],
    recordId: string,
    recordName: string,
    inventoryType: InventoryType,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      user: 'privacy.admin@privacorp.com',
      action,
      recordId,
      recordName,
      inventoryType,
      details,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // CRUD Implementations
  const addRecord = (inventoryType: InventoryType, recordData: any): string => {
    const now = new Date().toISOString();
    const currentUser = 'privacy.admin@privacorp.com';

    let prefix = 'PA';
    if (inventoryType === 'tspReferences') prefix = 'TSP';
    if (inventoryType === 'assets') prefix = 'AST';
    if (inventoryType === 'vendors') prefix = 'VND';
    if (inventoryType === 'entities') prefix = 'ENT';

    const newId = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const fullRecord = {
      ...recordData,
      id: newId,
      createdDate: now,
      createdBy: currentUser,
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
      status: recordData.status || 'Draft',
    };

    if (inventoryType === 'processingActivities') {
      setProcessingActivities(prev => [fullRecord, ...prev]);
    } else if (inventoryType === 'tspReferences') {
      setTspReferences(prev => [fullRecord, ...prev]);
    } else if (inventoryType === 'assets') {
      setAssets(prev => [fullRecord, ...prev]);
    } else if (inventoryType === 'vendors') {
      setVendors(prev => [fullRecord, ...prev]);
    } else if (inventoryType === 'entities') {
      setEntities(prev => [fullRecord, ...prev]);
    }

    addAuditLog('Created', newId, fullRecord.name, inventoryType, `Created new record in ${inventoryType}.`);
    return newId;
  };

  const updateRecord = (inventoryType: InventoryType, id: string, recordData: Partial<PrivacyRecord>) => {
    const now = new Date().toISOString();
    const currentUser = 'privacy.admin@privacorp.com';

    let recordName = id;

    if (inventoryType === 'processingActivities') {
      setProcessingActivities(prev =>
        prev.map(item => {
          if (item.id === id) {
            recordName = recordData.name || item.name;
            return { ...item, ...recordData, lastModifiedDate: now, lastModifiedBy: currentUser } as ProcessingActivity;
          }
          return item;
        })
      );
    } else if (inventoryType === 'tspReferences') {
      setTspReferences(prev =>
        prev.map(item => {
          if (item.id === id) {
            recordName = recordData.name || item.name;
            return { ...item, ...recordData, lastModifiedDate: now, lastModifiedBy: currentUser } as TSPReference;
          }
          return item;
        })
      );
    } else if (inventoryType === 'assets') {
      setAssets(prev =>
        prev.map(item => {
          if (item.id === id) {
            recordName = recordData.name || item.name;
            return { ...item, ...recordData, lastModifiedDate: now, lastModifiedBy: currentUser } as Asset;
          }
          return item;
        })
      );
    } else if (inventoryType === 'vendors') {
      setVendors(prev =>
        prev.map(item => {
          if (item.id === id) {
            recordName = recordData.name || item.name;
            return { ...item, ...recordData, lastModifiedDate: now, lastModifiedBy: currentUser } as Vendor;
          }
          return item;
        })
      );
    } else if (inventoryType === 'entities') {
      setEntities(prev =>
        prev.map(item => {
          if (item.id === id) {
            recordName = recordData.name || item.name;
            return { ...item, ...recordData, lastModifiedDate: now, lastModifiedBy: currentUser } as Entity;
          }
          return item;
        })
      );
    }

    addAuditLog('Updated', id, recordName, inventoryType, `Updated fields on record ${id}.`);
  };

  const deleteRecord = (inventoryType: InventoryType, id: string) => {
    let recordName = id;

    if (inventoryType === 'processingActivities') {
      const target = processingActivities.find(x => x.id === id);
      if (target) recordName = target.name;
      setProcessingActivities(prev => prev.filter(x => x.id !== id));
    } else if (inventoryType === 'tspReferences') {
      const target = tspReferences.find(x => x.id === id);
      if (target) recordName = target.name;
      setTspReferences(prev => prev.filter(x => x.id !== id));
    } else if (inventoryType === 'assets') {
      const target = assets.find(x => x.id === id);
      if (target) recordName = target.name;
      setAssets(prev => prev.filter(x => x.id !== id));
    } else if (inventoryType === 'vendors') {
      const target = vendors.find(x => x.id === id);
      if (target) recordName = target.name;
      setVendors(prev => prev.filter(x => x.id !== id));
    } else if (inventoryType === 'entities') {
      const target = entities.find(x => x.id === id);
      if (target) recordName = target.name;
      setEntities(prev => prev.filter(x => x.id !== id));
    }

    addAuditLog('Deleted', id, recordName, inventoryType, `Deleted record ${id} from inventory.`);
    if (selectedRecord?.id === id) setSelectedRecord(null);
  };

  const duplicateRecord = (inventoryType: InventoryType, id: string) => {
    let sourceRecord: any = null;
    if (inventoryType === 'processingActivities') sourceRecord = processingActivities.find(x => x.id === id);
    if (inventoryType === 'tspReferences') sourceRecord = tspReferences.find(x => x.id === id);
    if (inventoryType === 'assets') sourceRecord = assets.find(x => x.id === id);
    if (inventoryType === 'vendors') sourceRecord = vendors.find(x => x.id === id);
    if (inventoryType === 'entities') sourceRecord = entities.find(x => x.id === id);

    if (sourceRecord) {
      const { id: oldId, createdDate, lastModifiedDate, ...rest } = sourceRecord;
      addRecord(inventoryType, {
        ...rest,
        name: `${sourceRecord.name} (Copy)`,
        status: 'Draft',
      });
    }
  };

  const resetToDefaultData = () => {
    const demoData = resetToDemoStore();
    setProcessingActivities(demoData.processingActivities);
    setTspReferences(demoData.tspReferences);
    setAssets(demoData.assets);
    setVendors(demoData.vendors);
    setEntities(demoData.entities);
    setAuditLogs(demoData.auditLogs);
  };

  const exportDataJSON = () => {
    const payload = {
      version: '1.0',
      exportTimestamp: new Date().toISOString(),
      processingActivities,
      tspReferences,
      assets,
      vendors,
      entities,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privamap-data-mapping-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.processingActivities && parsed.assets && parsed.vendors) {
        setProcessingActivities(parsed.processingActivities);
        if (parsed.tspReferences) setTspReferences(parsed.tspReferences);
        setAssets(parsed.assets);
        setVendors(parsed.vendors);
        if (parsed.entities) setEntities(parsed.entities);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON', e);
    }
    return false;
  };

  return (
    <PrivacyDataContext.Provider
      value={{
        processingActivities,
        tspReferences,
        assets,
        vendors,
        entities,
        auditLogs,
        activeNav,
        setActiveNav,
        selectedRecord,
        setSelectedRecord,
        globalSearchQuery,
        setGlobalSearchQuery,
        addRecord,
        updateRecord,
        deleteRecord,
        duplicateRecord,
        getRelatedRecords,
        attentionItems,
        metrics,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </PrivacyDataContext.Provider>
  );
};

export const usePrivacyData = () => {
  const context = useContext(PrivacyDataContext);
  if (!context) {
    throw new Error('usePrivacyData must be used within a PrivacyDataProvider');
  }
  return context;
};
