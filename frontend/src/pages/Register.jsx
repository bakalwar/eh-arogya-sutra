import { Link, Navigate } from 'react-router-dom';
import CaduceusLogo from '../components/website/CaduceusLogo';
import '../styles/website.css';

export default function Register() {

  return (
    <div className="site-root flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1a0d]/90 p-8 text-center">
        <CaduceusLogo size={72} className="mx-auto site-logo-glow" />
        <h1 className="mt-4 font-display text-2xl text-[#e8c46a]">14 Din Free Trial</h1>
        <p className="mt-2 font-tagline text-lg italic text-white/60">आरोग्य सूत्र — Doctor Registration</p>
        <p className="mt-4 text-sm text-white/70 leading-relaxed">
          Doctor account ke liye abhi demo access use karein. Full self-registration jald available hoga.
        </p>
        <ul className="mt-4 space-y-2 text-left text-sm text-white/55">
          <li>✅ 14 din — sab Pro features</li>
          <li>✅ Bina credit card</li>
          <li>✅ Mobile + laptop</li>
        </ul>
        <Link
          to="/login"
          className="mt-6 inline-block w-full rounded-lg bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white shadow-lg shadow-emerald-900/30"
        >
          Demo Login se Shuru Karen →
        </Link>
        <Link to="/" className="mt-4 block text-xs text-[#c9963a]/80 underline">
          ← Homepage par wapas
        </Link>
        <p className="mt-4 text-[10px] text-white/35">Demo: 9876543210 / demo123</p>
      </div>
    </div>
  );
}
