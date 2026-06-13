import type { ReferralTier } from './types';

/** Product referral rewards (mandated program tiers) */
export const referralTiers: ReferralTier[] = [
  { count: 10, reward: '1 month free extension' },
  { count: 20, reward: '3 months free extension' },
  { count: 30, reward: '6 months free extension' },
  { count: 50, reward: '1 year free extension' },
  { count: 100, reward: 'Lifetime access' },
];
