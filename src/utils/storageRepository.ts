import {
  ProcessingActivity,
  TSPReference,
  Asset,
  Vendor,
  Entity,
  AuditLogEntry,
} from '../types/privacy';
import {
  initialProcessingActivities,
  initialTSPReferences,
  initialAssets,
  initialVendors,
  initialEntities,
  initialAuditLogs,
} from '../data/mockSeedData';

const LOCAL_STORAGE_KEY = 'privamap_data_store_v1';

export interface DataStore {
  processingActivities: ProcessingActivity[];
  tspReferences: TSPReference[];
  assets: Asset[];
  vendors: Vendor[];
  entities: Entity[];
  auditLogs: AuditLogEntry[];
}

/**
 * Loads the existing data store from persistence, or initializes it with the
 * mock seed dataset if the store is empty.
 */
export const loadDataStore = (): DataStore => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        Array.isArray(parsed.processingActivities) &&
        Array.isArray(parsed.assets) &&
        Array.isArray(parsed.vendors)
      ) {
        return {
          processingActivities: parsed.processingActivities,
          tspReferences: parsed.tspReferences || [],
          assets: parsed.assets,
          vendors: parsed.vendors,
          entities: parsed.entities || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (e) {
      console.error('Failed to parse saved privacy data mapping store', e);
    }
  }

  // Persistent storage is empty, so we seed with the demo data
  const seedStore: DataStore = {
    processingActivities: initialProcessingActivities,
    tspReferences: initialTSPReferences,
    assets: initialAssets,
    vendors: initialVendors,
    entities: initialEntities,
    auditLogs: initialAuditLogs,
  };
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedStore));
  return seedStore;
};

/**
 * Saves the given data store to persistent storage.
 */
export const saveDataStore = (store: DataStore): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save data mapping store to localStorage', e);
  }
};

/**
 * Resets the persistent storage back to its original demo seeding.
 */
export const resetToDemoStore = (): DataStore => {
  const seedStore: DataStore = {
    processingActivities: initialProcessingActivities,
    tspReferences: initialTSPReferences,
    assets: initialAssets,
    vendors: initialVendors,
    entities: initialEntities,
    auditLogs: initialAuditLogs,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedStore));
  return seedStore;
};

/**
 * Clears persistent storage entirely.
 */
export const clearDataStore = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};
