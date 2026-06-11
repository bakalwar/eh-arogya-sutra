import { NavLink } from 'react-router-dom';
import PreviewNotice from '../components/PreviewNotice';

const plans = [
  { name: 'Basic', price: '₹699', period: '/month', patients: '100 patients', color: '#4a9b54' },
  { name: 'Pro', price: '₹1499', period: '/month', patients: 'Unlimited patients', color: '#c9963a', popular: true },
  { name: 'Basic Yearly', price: '₹6,999', period: '/year', patients: '100 patients', color: '#4a9b54' },
  { name: 'Pro Yearly', price: '₹14,999', period: '/year', patients: 'Unlimited patients', color: '#c9963a' },
];

const upiMethods = [
  { name: 'PhonePe', icon: '📱', color: '#5f259f' },
  { name: 'Google Pay', icon: '💚', color: '#34a853' },
  { name: 'Paytm', icon: '💙', color: '#002970' },
];

export default function Payment() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <PreviewNotice>PhonePe / GPay / Paytm भुगतान API जल्द — प्लान देख सकते हैं, अभी चेकआउट नहीं।</PreviewNotice>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-eh-gold/80">Subscription</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-white">Payment &amp; Plans</h1>
        <p className="mt-1 text-sm text-white/45">14-din free trial ke baad apna plan chunein</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-eh-gold/20 bg-eh-gold/[0.05] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Current Plan</p>
            <p className="mt-1 font-display text-lg text-eh-gold">✨ Free Trial</p>
            <p className="text-sm text-white/50 mt-0.5">21 days remaining — All features unlocked</p>
          </div>
          <div className="rounded-full border border-eh-gold/30 px-4 py-1.5 text-xs font-semibold text-eh-gold">
            Active
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="relative rounded-xl border p-5 transition hover:border-opacity-60"
            style={{
              borderColor: plan.popular ? 'rgba(201,150,58,0.4)' : 'rgba(255,255,255,0.08)',
              background: plan.popular ? 'rgba(201,150,58,0.06)' : 'rgba(255,255,255,0.02)',
            }}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-4 rounded-full bg-eh-gold px-3 py-0.5 text-[10px] font-bold text-[#060d07]">
                Most Popular
              </span>
            )}
            <p className="font-display text-sm" style={{ color: plan.color }}>{plan.name}</p>
            <p className="mt-2 font-display text-2xl text-white">{plan.price}<span className="text-sm text-white/40">{plan.period}</span></p>
            <p className="mt-1 text-xs text-white/40">{plan.patients}</p>
            <button
              type="button"
              disabled
              title="भुगतान API जल्द"
              className="mt-4 w-full rounded-lg py-2 text-xs font-semibold transition opacity-50 cursor-not-allowed"
              style={{
                background: plan.popular ? 'rgba(201,150,58,0.15)' : 'rgba(255,255,255,0.05)',
                border: plan.popular ? '1px solid rgba(201,150,58,0.35)' : '1px solid rgba(255,255,255,0.1)',
                color: plan.popular ? '#e8c46a' : 'rgba(255,255,255,0.6)',
              }}
            >
              Select Plan
            </button>
          </div>
        ))}
      </div>

      {/* UPI Payment */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="mb-4 font-display text-sm text-white/80">Pay via UPI — Direct to Clinic Account</p>
        <div className="flex flex-wrap gap-3">
          {upiMethods.map((m) => (
            <button
              key={m.name}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="text-xl">{m.icon}</span>
              {m.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-white/25">PhonePe · GPay · Paytm QR — webhook auto-verify (NPCI UPI AutoPay)</p>
      </div>

      <p className="text-center text-[10px] text-white/20 pt-2">
        Yearly plan mein 2 mahine free — koi hidden charge nahi
      </p>
    </div>
  );
}
