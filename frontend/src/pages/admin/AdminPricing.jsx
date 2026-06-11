import { NavLink } from 'react-router-dom';

export default function AdminPricing() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-eh-gold/80">Admin</p>
          <h1 className="mt-1 font-display text-xl font-semibold text-white">💲 Pricing Control</h1>
          <p className="mt-1 text-sm text-white/40">Plan prices — existing doctors keep grandfathered price</p>
        </div>
        <NavLink to="/admin" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition">
          ← Admin Panel
        </NavLink>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
        <div className="text-5xl mb-4">💲</div>
        <div className="font-display text-lg text-white/70 mb-2">Pricing Control</div>
        <div className="text-sm text-white/35 max-w-md mx-auto">Plan prices — existing doctors keep grandfathered price</div>
        <div className="mt-6 inline-block rounded-lg border border-eh-gold/20 bg-eh-gold/[0.06] px-6 py-2 text-xs text-eh-gold/60">
          Yah section jald aa raha hai — Phase 2
        </div>
      </div>
    </div>
  );
}
