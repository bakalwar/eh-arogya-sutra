'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getBottomNavItems, getMoreMenuItems, isNavActive } from '@/lib/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const bottomItems = getBottomNavItems();
  const moreItems = getMoreMenuItems();
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href));

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bn-item${isNavActive(pathname, item.href) ? ' active' : ''}`}
            >
              <div className="bn-icon">{item.icon}</div>
              <div className="bn-label">{item.label}</div>
            </Link>
          ))}
          <button
            type="button"
            className={`bn-item${moreActive ? ' active' : ''}`}
            onClick={() => setSheetOpen(true)}
          >
            <div className="bn-icon">⚙️</div>
            <div className="bn-label">More</div>
          </button>
        </div>
      </nav>

      {sheetOpen ? (
        <>
          <button
            type="button"
            className="bn-sheet-backdrop"
            onClick={() => setSheetOpen(false)}
            aria-label="Close menu"
          />
          <div className="bn-sheet">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bn-sheet-row"
                onClick={() => setSheetOpen(false)}
              >
                <span className="bn-sheet-icon">{item.icon}</span>
                {item.sidebarLabel}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
