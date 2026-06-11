import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUser } from '../security/tokenManager';

const tiers = [
  { count: 10,  reward: '1 Month Free',   icon: '🥉' },
  { count: 20,  reward: '3 Months Free',  icon: '🥈' },
  { count: 30,  reward: '6 Months Free',  icon: '🥇' },
  { count: 50,  reward: '1 Year Free',    icon: '🏆' },
  { count: 100, reward: 'Lifetime Free',  icon: '👑' },
];

export default function Referral() {
  const user = getUser();
  const referralCode = user?.referral_code || `DR-${(user?.name || 'DEMO').toUpperCase().replace(/\s+/g, '').slice(0, 6)}-2026`;
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const verified = 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-eh-gold/80">Earn Free Subscription</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-white">Referral Program</h1>
        <p className="mt-1 text-sm text-white/45">Dusre EH doctors ko refer karein — free subscription payein</p>
      </div>

      {/* Referral code card */}
      <div className="rounded-xl border border-eh-gold/25 bg-eh-gold/[0.06] p-6 text-center">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Your Referral Code</p>
        <p className="font-display text-2xl tracking-widest text-eh-gold">{referralCode}</p>
        <button
          onClick={copyCode}
          className="mt-4 rounded-lg border border-eh-gold/30 bg-eh-gold/10 px-6 py-2 text-sm font-semibold text-eh-gold transition hover:bg-eh-gold/20"
        >
          {copied ? '✅ Copied!' : '📋 Copy Code'}
        </button>
        <p className="mt-3 text-xs text-white/30">Share this code — jab doctor paid plan le, aapko reward milega</p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-sm text-white/80">Your Progress</p>
          <p className="text-2xl font-bold text-eh-gold">{verified} <span className="text-sm text-white/30">verified referrals</span></p>
        </div>
        <div className="h-2 rounded-full bg-white/5">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-eh-sage to-eh-mint transition-all"
            style={{ width: `${Math.min((verified / 10) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/30">{Math.max(10 - verified, 0)} more to unlock 1 month free</p>
      </div>

      {/* Reward tiers */}
      <div className="space-y-3">
        <p className="font-display text-sm text-white/60 uppercase tracking-wider">Reward Tiers</p>
        {tiers.map((tier) => (
          <div
            key={tier.count}
            className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4"
            style={verified >= tier.count ? { borderColor: 'rgba(74,155,84,0.35)', background: 'rgba(74,155,84,0.05)' } : {}}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white/80">{tier.count} Verified Referrals</p>
                <p className="text-xs text-white/35">One phone = one account · real payment required</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-eh-gold">{tier.reward}</p>
              {verified >= tier.count && <p className="text-[10px] text-eh-mint mt-0.5">✅ Unlocked</p>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-white/20 pt-2">
        Code format: DR-NAME-YEAR · Anti-fraud: ek phone = ek account
      </p>
    </div>
  );
}
