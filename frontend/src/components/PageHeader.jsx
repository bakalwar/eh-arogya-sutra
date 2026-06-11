import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-[24px] md:text-[32px] font-heading font-bold text-[var(--text)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-[var(--muted)] font-subtitle italic">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
