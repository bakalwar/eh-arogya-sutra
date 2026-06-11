import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, mobileCard: MobileCard }) {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block card-base overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-[var(--border)]">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-3 text-[9px] font-heading font-bold uppercase tracking-[2px] text-[var(--muted)] ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border2)]">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-[rgba(201,150,58,0.05)] transition-colors group cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-6 py-4 text-[13px] ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {data.map((row, i) => (
          MobileCard ? (
            <MobileCard key={i} row={row} onClick={() => onRowClick?.(row)} />
          ) : (
            <div 
              key={i} 
              className="card-base p-4 flex items-center justify-between group active:scale-[0.98]"
              onClick={() => onRowClick?.(row)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate">{row.name || row.title || 'Entry'}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{row.subtitle || row.diagnosis || ''}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--gold)]" />
            </div>
          )
        ))}
      </div>
    </div>
  );
}
