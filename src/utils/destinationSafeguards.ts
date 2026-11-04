import { AssetTransferLink, ProcessingActivity } from '../types/privacy';

export const SAFEGUARD_PRESETS = ['Adequacy or equivalent', 'SCCs'] as const;

export type SafeguardPreset = (typeof SAFEGUARD_PRESETS)[number];

type SafeguardSource = Pick<
  ProcessingActivity,
  | 'dataSourceAssetIds'
  | 'dataDestinationAssetIds'
  | 'transferSafeguards'
  | 'transferSafeguardsByDestination'
  | 'assetTransferLinks'
>;

export const transferLinkId = (fromAssetId: string, toAssetId: string) => `link:${fromAssetId}:${toAssetId}`;

export const createTransferLink = (
  fromAssetId: string,
  toAssetId: string,
  safeguard = ''
): AssetTransferLink => ({
  id: transferLinkId(fromAssetId, toAssetId),
  fromAssetId,
  toAssetId,
  safeguard,
});

export const safeguardsFromLinks = (links: AssetTransferLink[]): Record<string, string> => {
  const map: Record<string, string> = {};
  links.forEach(link => {
    const current = map[link.toAssetId];
    const next = (link.safeguard || '').trim();
    if (!current) {
      map[link.toAssetId] = next;
      return;
    }
    if (next && !current.split('; ').includes(next)) map[link.toAssetId] = `${current}; ${next}`;
  });
  return map;
};

export const resolveTransferLinks = (activity: SafeguardSource): AssetTransferLink[] => {
  const sourceId = activity.dataSourceAssetIds?.[0] || '';
  const destinationIds = (activity.dataDestinationAssetIds || []).filter(id => id && id !== sourceId);
  const stored = (activity.assetTransferLinks || []).filter(
    link => link.fromAssetId && link.toAssetId && link.fromAssetId !== link.toAssetId && link.toAssetId !== sourceId
  );
  if (stored.length > 0) return stored;
  if (!sourceId) return [];

  const safeguards = destinationSafeguardMap({ ...activity, assetTransferLinks: [] });
  return destinationIds.map(toAssetId => createTransferLink(sourceId, toAssetId, safeguards[toAssetId] || ''));
};

export const isPresetSafeguard = (value: string): value is SafeguardPreset =>
  value === 'Adequacy or equivalent' || value === 'SCCs';

export const isMeaningfulSafeguard = (value: string | undefined): boolean => {
  const text = (value || '').trim();
  return Boolean(text) && text.toLowerCase() !== 'none';
};

export const destinationSafeguardMap = (activity: SafeguardSource): Record<string, string> => {
  if (activity.assetTransferLinks && activity.assetTransferLinks.length > 0) {
    return safeguardsFromLinks(activity.assetTransferLinks);
  }
  const ids = activity.dataDestinationAssetIds || [];
  const stored = activity.transferSafeguardsByDestination;
  const hasStored = Boolean(stored && Object.keys(stored).length > 0);
  if (hasStored) {
    return Object.fromEntries(ids.map(id => [id, (stored?.[id] || '').trim()]));
  }

  const legacy = (activity.transferSafeguards || '').trim();
  const value = isMeaningfulSafeguard(legacy) ? legacy : '';
  return Object.fromEntries(ids.map(id => [id, value]));
};

export const primaryTransferSafeguard = (destinationIds: string[], safeguards: Record<string, string>): string => {
  const first = destinationIds[0];
  return first ? (safeguards[first] || '').trim() : '';
};

export interface DestinationSafeguardLine {
  assetId: string;
  assetName: string;
  safeguard: string;
}

export const destinationSafeguardLines = (
  activity: SafeguardSource,
  assets: Array<{ id: string; name: string }>
): DestinationSafeguardLine[] => {
  const nameOf = (id: string) => assets.find(asset => asset.id === id)?.name || id;
  const links = resolveTransferLinks(activity);
  if (links.length > 0) {
    return links.map(link => ({
      assetId: link.id,
      assetName: `${nameOf(link.fromAssetId)} → ${nameOf(link.toAssetId)}`,
      safeguard: link.safeguard,
    }));
  }

  const ids = activity.dataDestinationAssetIds || [];
  const safeguards = destinationSafeguardMap({ ...activity, assetTransferLinks: [] });
  if (ids.length === 0) {
    const legacy = (activity.transferSafeguards || '').trim();
    return legacy ? [{ assetId: '', assetName: '', safeguard: legacy }] : [];
  }

  return ids.map(id => ({
    assetId: id,
    assetName: nameOf(id),
    safeguard: safeguards[id] || '',
  }));
};
