'use client';

import Link from 'next/link';
import CaduceusLogo from '@/components/ui/CaduceusLogo';
import { useSessionProfile } from '@/lib/session/useSessionProfile';

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { initials } = useSessionProfile();

  return (
    <header className="topbar">
      <button type="button" className="hamburger" onClick={onMenuClick} aria-label="Menu">
        <span />
        <span />
        <span />
      </button>

      <Link href="/reports" className="topbar-logo">
        <CaduceusLogo size={36} gradientPrefix="topbar" />
        <div className="topbar-logo-text">
          <div className="topbar-name">AROGYA SUTRA</div>
          <div className="topbar-sub">E.H. Practitioner</div>
        </div>
      </Link>

      <div className="topbar-spacer" />

      <div className="topbar-search">
        <span className="ts-icon">🔍</span>
        <input type="text" placeholder="Search patients, medicines..." />
      </div>

      <button type="button" className="topbar-lang">
        🌐 Hindi
      </button>

      <Link href="/clinic" className="topbar-avatar" aria-label="Clinic profile" suppressHydrationWarning>
        {initials}
      </Link>
    </header>
  );
}
