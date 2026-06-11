import { useId } from 'react';

export default function CaduceusLogo({ size = 90, className = '', glow = true }) {
  const uid = useId().replace(/:/g, '');
  const gid1 = `w-staff-${uid}`;
  const gid2 = `w-wings-${uid}`;
  const gid3 = `w-snakes-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 18px rgba(201,150,58,0.45))' } : undefined}
      aria-hidden
    >
      <circle cx="50" cy="50" r="47" stroke="#c9963a" strokeWidth="1" opacity="0.4" />
      <circle cx="50" cy="50" r="39" stroke="#c9963a" strokeWidth="0.5" opacity="0.2" />
      <line x1="50" y1="16" x2="50" y2="84" stroke={`url(#${gid1})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 24 C41 17 26 19 23 26 C30 22 42 25 50 31" fill={`url(#${gid2})`} opacity="0.95" />
      <path d="M50 24 C59 17 74 19 77 26 C70 22 58 25 50 31" fill={`url(#${gid2})`} opacity="0.95" />
      <path d="M50 31 C43 37 39 44 42 51 C45 57 42 64 37 70" stroke={`url(#${gid3})`} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 31 C57 37 61 44 58 51 C55 57 58 64 63 70" stroke={`url(#${gid3})`} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="72" r="2.5" fill="#4a9b54" />
      <circle cx="63" cy="72" r="2.5" fill="#4a9b54" />
      <path d="M50 43 L54 50 L50 57 L46 50Z" fill="#e8c46a" opacity="0.9" />
      <path d="M44 50 L50 46 L56 50 L50 54Z" fill="#c9963a" opacity="0.7" />
      <circle cx="50" cy="50" r="3" fill="#f5e4b0" />
      <circle cx="50" cy="3" r="2" fill="#c9963a" opacity="0.7" />
      <circle cx="50" cy="97" r="2" fill="#c9963a" opacity="0.7" />
      <defs>
        <linearGradient id={gid1} x1="50" y1="16" x2="50" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8c46a" />
          <stop offset="100%" stopColor="#8B6320" />
        </linearGradient>
        <linearGradient id={gid2} x1="23" y1="19" x2="77" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B6320" />
          <stop offset="50%" stopColor="#e8c46a" />
          <stop offset="100%" stopColor="#8B6320" />
        </linearGradient>
        <linearGradient id={gid3} x1="50" y1="31" x2="50" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2d6a35" />
          <stop offset="100%" stopColor="#6abf72" />
        </linearGradient>
      </defs>
    </svg>
  );
}
