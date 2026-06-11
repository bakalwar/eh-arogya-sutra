import React from 'react';

export default function StatCard({ value, label, icon: Icon, color, trend, urgent }) {
  return (
    <div className={`card-base h-[80px] p-4 flex flex-col justify-center relative overflow-hidden group ${urgent ? 'border-[var(--red)]/40 bg-[var(--red)]/5' : ''}`}>
      <div className="flex flex-col">
        <span className="text-[28px] font-heading font-bold leading-none" style={{ color: urgent ? 'var(--red)' : color }}>
          {value}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] mt-1 font-bold">
          {label}
        </span>
      </div>
      {Icon && (
        <Icon className={`absolute top-3 right-3 w-5 h-5 transition-transform group-hover:scale-110 ${urgent ? 'text-[var(--red)]/30' : 'text-[var(--faint)]'}`} />
      )}
      {trend && (
        <div className="absolute bottom-2 right-3 text-[9px] font-bold text-[var(--green)]">
          {trend}
        </div>
      )}
    </div>
  );
}
