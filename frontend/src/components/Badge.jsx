import React from 'react';

export default function Badge({ text, type = 'info' }) {
  const styles = {
    success: 'bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20',
    danger: 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20',
    warning: 'bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20',
    info: 'bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/20',
    muted: 'bg-white/5 text-[var(--muted)] border-white/10'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[type] || styles.info}`}>
      {text}
    </span>
  );
}
