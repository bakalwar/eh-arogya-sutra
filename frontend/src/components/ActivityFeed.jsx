import React from 'react';
import { Shield, Pill, CheckCircle, LogIn, Activity } from 'lucide-react';
import Badge from './Badge';

const ICONS = {
  auth: { icon: LogIn, color: 'var(--blue)' },
  medicine: { icon: Pill, color: 'var(--gold2)' },
  verify: { icon: CheckCircle, color: 'var(--green)' },
  system: { icon: Shield, color: 'var(--muted)' },
  default: { icon: Activity, color: 'var(--gold)' }
};

export default function ActivityFeed({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const config = ICONS[item.type] || ICONS.default;
        const Icon = config.icon;

        return (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/5 shadow-inner shrink-0"
              style={{ backgroundColor: `${config.color}10`, color: config.color }}
            >
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text)] truncate">{item.text}</p>
              <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mt-0.5">{item.time}</p>
            </div>
            <div className="hidden sm:block">
              <Badge text={item.badge || item.type} type={item.badgeType || 'muted'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
