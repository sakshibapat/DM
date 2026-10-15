import assert from 'node:assert/strict';
import {
  cloneDefaultInventoryConfig,
  getOptionValues,
  mergeInventoryConfig,
  validateInventoryOptions,
} from '../src/types/inventoryConfig';
import {
  loadInventoryConfig,
  resetInventoryConfigStore,
  saveInventoryConfig,
} from '../src/utils/storageRepository';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size;
    },
  },
  configurable: true,
});

const defaults = cloneDefaultInventoryConfig();
const purposes = defaults.inventories.processingActivities.optionGroups.controllerPurposes;

assert.ok(purposes.options.length > 0, 'default option groups should be populated');
assert.equal(validateInventoryOptions(purposes.options), null);
assert.equal(
  validateInventoryOptions([
    ...purposes.options,
    { ...purposes.options[0], id: 'duplicate', value: purposes.options[0].value.toUpperCase() },
  ]),
  'Option values must be unique.'
);
assert.equal(
  validateInventoryOptions([{ id: 'empty', value: '  ', label: '', enabled: true }]),
  'Options cannot be empty.'
);

const customized = cloneDefaultInventoryConfig();
customized.inventories.assets.optionGroups.assetTypes.options = [
  { id: 'custom', value: 'Custom Managed Type', label: 'Custom Managed Type', enabled: true },
  { id: 'disabled', value: 'Legacy Type', label: 'Legacy Type', enabled: false },
];
const merged = mergeInventoryConfig(customized);
assert.deepEqual(
  getOptionValues(merged, 'assets', 'assetTypes'),
  ['Custom Managed Type'],
  'disabled options should be excluded for new records'
);
assert.deepEqual(
  getOptionValues(merged, 'assets', 'assetTypes', ['Legacy Type']),
  ['Custom Managed Type', 'Legacy Type'],
  'legacy values should remain available while editing existing records'
);
assert.ok(
  merged.inventories.assets.optionGroups.locations.options.length > 0,
  'missing option groups should migrate from defaults'
);

saveInventoryConfig(customized);
assert.equal(
  loadInventoryConfig().inventories.assets.optionGroups.assetTypes.options[0].value,
  'Custom Managed Type',
  'saved configuration should round-trip through persistence'
);
assert.notEqual(
  resetInventoryConfigStore().inventories.assets.optionGroups.assetTypes.options[0].value,
  'Custom Managed Type',
  'reset should restore defaults'
);

const reordered = [...purposes.options].reverse();
assert.deepEqual(
  getOptionValues(
    {
      ...defaults,
      inventories: {
        ...defaults.inventories,
        processingActivities: {
          ...defaults.inventories.processingActivities,
          optionGroups: {
            ...defaults.inventories.processingActivities.optionGroups,
            controllerPurposes: { ...purposes, options: reordered },
          },
        },
      },
    },
    'processingActivities',
    'controllerPurposes'
  ),
  reordered.map(option => option.value),
  'configured order should be preserved'
);

console.log('Inventory configuration tests passed.');
