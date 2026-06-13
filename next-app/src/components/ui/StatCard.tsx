import type { StatItem } from '@/lib/types';

export default function StatCard({ stat }: { stat: StatItem }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{stat.icon}</div>
      <div className="stat-val">{stat.value}</div>
      <div className="stat-label">{stat.label}</div>
      <div className={`stat-change ${stat.trend}`}>{stat.change}</div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
