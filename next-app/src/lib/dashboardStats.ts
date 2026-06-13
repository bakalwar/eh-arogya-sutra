import type { StatItem } from './types';

/** Dashboard stat cards — values filled from live API where available */
export const dashboardStatTemplate: StatItem[] = [
  { icon: '👥', value: '—', label: 'Total Patients', change: '', trend: 'up' },
  { icon: '📋', value: '—', label: "Today's Cases", change: '', trend: 'up' },
  { icon: '📄', value: '—', label: 'Prescriptions', change: '', trend: 'up' },
  { icon: '📅', value: '—', label: 'Follow-ups Due', change: '', trend: 'down' },
];
