import Link from 'next/link';
import { EHAS2Logo } from '../brand/EHAS2Logo';
import { IconButton } from '../ui/Button';

type TopBarProps = {
  title?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

export function TopBar({
  title = 'E.H. AROGYA SUTRA 2',
  onMenuClick,
  showMenuButton = false,
}: TopBarProps) {
  return (
    <header className="ehas2-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {showMenuButton ? (
          <IconButton label="Open navigation" onClick={onMenuClick}>
            ☰
          </IconButton>
        ) : null}
        <Link className="ehas2-topbar__brand" href="/">
          <EHAS2Logo size={36} priority />
          <span>{title}</span>
        </Link>
      </div>
      <div aria-label="Account menu shell">
        <IconButton label="Account menu">◎</IconButton>
      </div>
    </header>
  );
}
