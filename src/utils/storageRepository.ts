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
import {
  ConfigurationAuditEntry,
  InventoryConfigDocument,
  cloneDefaultInventoryConfig,
  mergeInventoryConfig,
} from '../types/inventoryConfig';

const LOCAL_STORAGE_KEY = 'privamap_data_store_v1';
const INVENTORY_CONFIG_STORAGE_KEY = 'privamap_inventory_config_v1';
const CONFIG_AUDIT_STORAGE_KEY = 'privamap_config_audit_v1';

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

export const loadInventoryConfig = (): InventoryConfigDocument => {
  try {
    const saved = localStorage.getItem(INVENTORY_CONFIG_STORAGE_KEY);
    return mergeInventoryConfig(saved ? JSON.parse(saved) : null);
  } catch (error) {
    console.error('Failed to parse saved inventory configuration', error);
    return cloneDefaultInventoryConfig();
  }
};

export const saveInventoryConfig = (config: InventoryConfigDocument): void => {
  try {
    localStorage.setItem(INVENTORY_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save inventory configuration', error);
  }
};

export const resetInventoryConfigStore = (): InventoryConfigDocument => {
  const defaults = cloneDefaultInventoryConfig();
  saveInventoryConfig(defaults);
  return defaults;
};

export const loadConfigurationAuditLog = (): ConfigurationAuditEntry[] => {
  try {
    const saved = localStorage.getItem(CONFIG_AUDIT_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse configuration audit log', error);
    return [];
  }
};

export const saveConfigurationAuditLog = (entries: ConfigurationAuditEntry[]): void => {
  try {
    localStorage.setItem(CONFIG_AUDIT_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save configuration audit log', error);
  }
};
