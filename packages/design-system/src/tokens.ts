export const DESIGN_SYSTEM_VERSION = 'jupiter-v1' as const;

/** Canonical Jupiter palette — prefer CSS semantic tokens in components. */
export const jupiterColors = {
  white: '#FFFFFF',
  softGrey: '#F4F7F5',
  space900: '#0D1B2A',
  space800: '#162236',
  space700: '#1E3048',
  space600: '#274060',
  space500: '#3A5A7C',
  space400: '#5B7FA0',
  mint: '#00E676',
  mintSoft: '#E8FDF2',
  mintMid: '#B2F5D4',
  orange: '#FF6D00',
  gold: '#F9A825',
  red: '#E53935',
  blue: '#1976D2',
  purple: '#7B1FA2',
  teal: '#00897B',
} as const;

export const breakpoints = {
  mobileMax: 599,
  tabletMin: 600,
  tabletMax: 1023,
  desktopMin: 1024,
} as const;

export const qaWidths = [320, 360, 390, 430, 768, 1024, 1280, 1366, 1440, 1920] as const;

export const touchTargetMinPx = 44 as const;

export const brandAssets = {
  logoPath: '/brand/ehas2-logo.png',
  logoAlt: 'E.H. Arogya Sutra 2 logo',
} as const;
