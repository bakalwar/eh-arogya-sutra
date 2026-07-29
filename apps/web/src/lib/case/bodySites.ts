export type BodySite = {
  id: string;
  label: string;
  region: string;
  lateralityRelevant: boolean;
};

export const BODY_SITES: readonly BodySite[] = [
  { id: 'head', label: 'Head', region: 'Head & neck', lateralityRelevant: false },
  { id: 'neck', label: 'Neck', region: 'Head & neck', lateralityRelevant: false },
  { id: 'chest', label: 'Chest', region: 'Trunk', lateralityRelevant: true },
  { id: 'abdomen', label: 'Abdomen', region: 'Trunk', lateralityRelevant: false },
  { id: 'back', label: 'Back', region: 'Trunk', lateralityRelevant: true },
  { id: 'left-arm', label: 'Left arm', region: 'Upper limb', lateralityRelevant: false },
  { id: 'right-arm', label: 'Right arm', region: 'Upper limb', lateralityRelevant: false },
  { id: 'left-leg', label: 'Left leg', region: 'Lower limb', lateralityRelevant: false },
  { id: 'right-leg', label: 'Right leg', region: 'Lower limb', lateralityRelevant: false },
  { id: 'skin-general', label: 'Skin (general)', region: 'General', lateralityRelevant: false },
  { id: 'systemic', label: 'Systemic / whole body', region: 'General', lateralityRelevant: false },
] as const;

export function searchBodySites(query: string): BodySite[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...BODY_SITES];
  return BODY_SITES.filter(
    (s) => s.label.toLowerCase().includes(q) || s.region.toLowerCase().includes(q),
  );
}

export function groupBodySites(sites: readonly BodySite[]): Record<string, BodySite[]> {
  return sites.reduce<Record<string, BodySite[]>>((acc, site) => {
    acc[site.region] = acc[site.region] ?? [];
    acc[site.region].push(site);
    return acc;
  }, {});
}
