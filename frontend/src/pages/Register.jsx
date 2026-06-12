import { Link } from 'react-router-dom';
import CaduceusLogo from '../components/website/CaduceusLogo';
import '../styles/website.css';

export default function Register() {
  return (
    <div className="site-root flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1a0d]/90 p-8 text-center">
        <CaduceusLogo size={72} className="mx-auto site-logo-glow" />
        <h1 className="mt-4 font-display text-2xl text-[#e8c46a]">Doctor Registration</h1>
        <p className="mt-2 font-tagline text-lg italic text-white/60">आरोग्य सूत्र — Admin-assisted signup</p>
        <p className="mt-4 text-sm text-white/70 leading-relaxed">
          Naya doctor account sirf Admin banata hai. Pehle se registered hain to login karein.
        </p>
        <ul className="mt-4 space-y-2 text-left text-sm text-white/55">
          <li>✅ Admin aapka mobile register karega</li>
          <li>✅ Temporary password WhatsApp/call se milega</li>
          <li>✅ Pehli login par naya password set karein</li>
        </ul>
        <Link
          to="/login"
          className="mt-6 inline-block w-full rounded-lg bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white shadow-lg shadow-emerald-900/30"
        >
          Login →
        </Link>
        <Link to="/" className="mt-4 block text-xs text-[#c9963a]/80 underline">
          ← Homepage par wapas
        </Link>
      </div>
    </div>
  );
}
