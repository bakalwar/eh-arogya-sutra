import React from 'react';

export default function QuickAction({ icon: Icon, label, onClick, color = 'var(--gold)' }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 h-[48px] bg-[#121f13] border border-[rgba(201,150,58,0.15)] rounded-[var(--radius-button)] hover:border-[var(--gold)] hover:shadow-[0_0_15px_rgba(201,150,58,0.2)] transition-all group w-full"
    >
      <Icon className="w-[18px] h-[18px] transition-transform group-hover:scale-110" style={{ color }} />
      <span className="text-[12px] font-body font-medium text-[var(--text)]">{label}</span>
    </button>
  );
}
