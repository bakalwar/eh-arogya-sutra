import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CaduceusLogo from '../components/website/CaduceusLogo';
import MatteiBrandMark from '../components/website/MatteiBrandMark';
import { useCountUp, useInView } from '../hooks/useInView';
import '../styles/website.css';

const FEATURES = [
  { icon: '🔍', title: 'Smart Search Engine', desc: 'Symptoms → polarity, vitiation, 4 formulas — Count Mattei rules automatic.' },
  { icon: '📸', title: 'Photo Analysis', desc: 'Chehra dekh kar diagnosis support — eyes, skin, lips zones.' },
  { icon: '📋', title: 'Report Analysis', desc: 'Blood / MRI / CT / sonography auto-read — problems symptoms mein.' },
  { icon: '📄', title: 'PDF Prescription', desc: 'Jagdamba Clinic style digital prescription — professional PDF.' },
  { icon: '📚', title: 'Book Library', desc: 'EH books upload + OCR — reference at your fingertips.' },
  { icon: '🌐', title: '10 Languages', desc: 'Hindi, Gujarati, Tamil, Telugu, Marathi, Urdu, Bengali, Arabic…' },
  { icon: '💊', title: '1000-Word Summary', desc: 'Clinical summary English + 9 languages — one click.' },
  { icon: '🔢', title: 'Repeat Patient', desc: 'Improvement % track — visit history smart compare.' },
  { icon: '🏪', title: 'EH Pharmacy', desc: 'Medicines order — practice integrated.' }
];

const STEPS = [
  { icon: '📝', title: 'Details Daalein', desc: 'Patient, symptoms, BP, duration — sab ek jagah.' },
  { icon: '🔍', title: 'System Analyze', desc: 'Polarity, phase, vitiation — automatic CDSS.' },
  { icon: '💊', title: 'Formula Select', desc: 'Collectobachi A–D medicines suggest.' },
  { icon: '📄', title: 'PDF Taiyar', desc: 'Prescription + summary download / print.' }
];

const FAQ = [
  {
    q: 'Kya yah sirf EH doctors ke liye hai?',
    a: 'Haan, yah specifically Electro Homoeopathy practitioners ke liye banaya gaya hai — Count Cesare Mattei ke siddhanton par.'
  },
  {
    q: 'Kya data secure hai?',
    a: 'Haan — 14-layer security model, JWT auth, OTP email, encrypted sessions (mandated architecture).'
  },
  {
    q: 'Mobile par chalega?',
    a: 'Haan — PWA technology se mobile, tablet, laptop sab par chalega.'
  },
  {
    q: 'Free trial mein kya milega?',
    a: '14 din ke liye sab Pro features free — bina credit card.'
  },
  {
    q: 'Payment kaise karein?',
    a: 'PhonePe, Google Pay, Paytm QR — direct clinic account (mandated stack).'
  }
];

const TESTIMONIALS = [
  {
    text: 'Pehle sirf yaad se dawa likhte the. Ab system khud suggest karta hai. Bahut faydemand hai!',
    name: 'Dr. Ramesh Kumar',
    role: 'BEMS, Seoni M.P.'
  },
  {
    text: 'Report upload karke symptoms auto-add — time bachta hai. EH practice digital ho gayi.',
    name: 'Dr. Priya Sharma',
    role: 'EH Practitioner, Nagpur'
  },
  {
    text: '1000-word summary Hindi mein — patient ko samjhana easy. Professional PDF bhi.',
    name: 'Dr. Anil Verma',
    role: 'BEMS, Chhindwara'
  }
];

function StatItem({ value, suffix, label, sub }) {
  const [ref, inView] = useInView();
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="text-center px-4 py-6">
      <p className="font-display text-3xl md:text-4xl text-[#e8c46a]">
        {n}
        {suffix}
      </p>
      <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
      <p className="text-xs text-white/45">{sub}</p>
    </div>
  );
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border border-white/[0.07] overflow-hidden mb-2 ${open ? 'site-faq-item open' : ''}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium bg-white/[0.03] hover:bg-white/[0.05]"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{item.q}</span>
        <span className="text-[#c9963a]">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-white/60 leading-relaxed">{item.a}</div>}
    </div>
  );
}

export default function Website() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('hi');

  useEffect(() => {
    document.title = 'E.H. Arogya Sutra — Electro Homoeopathy Clinical System';
  }, []);

  const navLinks = [
    { href: '#features', label: lang === 'hi' ? 'Features' : 'Features' },
    { href: '#pricing', label: lang === 'hi' ? 'Pricing' : 'Pricing' },
    { href: '#how', label: lang === 'hi' ? 'How It Works' : 'How It Works' },
    { href: '#contact', label: 'Contact' }
  ];

  return (
    <div className="site-root">
      <nav className="site-nav">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/website" className="flex items-center gap-2 shrink-0 min-w-0">
            <MatteiBrandMark layout="row" size="sm" showSubtitle titleAs="span" />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-white/65">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#e8c46a] transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline text-xs text-[#c9963a]/90 hover:text-[#e8c46a] px-2 border border-[#c9963a]/25 rounded-full py-1"
            >
              {lang === 'hi' ? 'ऐप खोलें' : 'Open app'}
            </Link>
            <button
              type="button"
              className="hidden sm:inline-flex rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60"
              onClick={() => setLang((x) => (x === 'hi' ? 'en' : 'hi'))}
            >
              🌐 {lang === 'hi' ? 'EN' : 'HI'}
            </button>
            <Link to="/login" className="hidden sm:inline text-sm text-white/70 hover:text-white px-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] px-3 py-2 text-xs sm:text-sm font-semibold text-white"
            >
              Start Free Trial →
            </Link>
            <button
              type="button"
              className="md:hidden text-xl px-2"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#060d07] px-4 py-3 space-y-2">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link to="/login" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/" className="block py-2 text-sm text-[#c9963a]" onClick={() => setMenuOpen(false)}>
              {lang === 'hi' ? 'ऐप खोलें' : 'Open app'}
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="site-hero flex flex-col items-center justify-center text-center px-4 pb-16">
        <div className="site-hero-shimmer w-full absolute top-[64px] left-0 right-0" />
        <div className="site-particles" aria-hidden>
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="site-particle"
              style={{
                left: `${8 + (i * 7) % 85}%`,
                top: `${12 + (i * 11) % 70}%`,
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 site-logo-pop mt-8">
          <MatteiBrandMark layout="column" size="lg" titleAs="h1" />
        </div>

        <p className="site-fade-up site-delay-1 relative z-10 mt-6 text-xs tracking-[0.35em] text-[#c9963a]/80 uppercase">
          Electro Homoeopathy
        </p>
        <p className="site-fade-up site-delay-2 relative z-10 mt-3 text-sm text-white/50">
          Count Cesare Mattei · E.H.
        </p>
        <p className="site-fade-up site-delay-2 relative z-10 mt-2 font-tagline text-2xl md:text-3xl italic text-[#e8c46a]/90">
          आरोग्य सूत्र
        </p>
        <p className="site-fade-up site-delay-3 relative z-10 mt-6 max-w-xl font-tagline text-lg md:text-xl italic text-white/75">
          &quot;Electro Homoeopathy ka Pehla Intelligent Clinical System&quot;
        </p>
        <p className="site-fade-up site-delay-3 relative z-10 mt-3 max-w-2xl text-sm text-white/55 leading-relaxed">
          Count Cesare Mattei ke Siddhanton par Aadharit — Modern Technology ke Saath
        </p>

        <div className="site-fade-up site-delay-4 relative z-10 mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="rounded-lg bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/40"
          >
            🚀 Free Trial Shuru Karen
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-[#c9963a]/40 bg-white/5 px-8 py-3.5 text-base font-medium text-[#e8c46a]"
          >
            ▶️ Demo Dekhein
          </a>
        </div>

        <div className="site-fade-up site-delay-5 relative z-10 mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/50">
          <span>✅ 14 Din Free</span>
          <span>✅ No Credit Card</span>
          <span>✅ Mobile + Laptop</span>
        </div>
      </header>

      {/* STATS */}
      <section className="border-y border-[#c9963a]/15 bg-[#c9963a]/[0.06]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4">
          <StatItem value={500} suffix="+" label="Doctors" sub="Using" />
          <StatItem value={38} suffix="" label="EH Medicines" sub="In CDSS" />
          <StatItem value={14} suffix="" label="Security" sub="Layers" />
          <StatItem value={10} suffix="" label="Bhasha" sub="Summary" />
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-2xl text-[#e8c46a] mb-12">EH Doctors ke Samasya → Hal</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-rose-300/90 mb-4">❌ Samasya</h3>
            <ul className="space-y-3">
              {[
                'Koi standardized digital tool nahi',
                'Sirf yaaddasht par depend rehna',
                'Paper prescriptions — kho jaati hain',
                'Patient history track nahi hoti',
                'Badhti practice manage karna mushkil'
              ].map((t) => (
                <li key={t} className="rounded-lg border border-rose-500/20 bg-rose-950/20 px-4 py-3 text-sm text-white/70">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-300/90 mb-4">✅ E.H. AROGYA SUTRA se Hal</h3>
            <ul className="space-y-3">
              {[
                'Intelligent Clinical System',
                'Count Mattei ke rules automatic',
                'Digital prescriptions forever',
                'Complete patient history',
                'Practice management easy'
              ].map((t) => (
                <li key={t} className="rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 text-sm text-white/75">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center mt-8 text-3xl text-[#c9963a]/50">↓</p>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-[#0b1a0d]/50 py-20 px-4">
        <h2 className="text-center font-display text-3xl text-[#e8c46a] mb-4">Kya Kya Milega Aapko?</h2>
        <p className="text-center text-sm text-white/45 mb-12 max-w-lg mx-auto">Complete CDSS for Electro Homoeopathy practice</p>
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="site-feature-card">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg text-[#e8c46a]">{f.title}</h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl text-[#e8c46a] mb-12">Kaise Kaam Karta Hai?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative text-center">
              {i > 0 && (
                <span
                  className="hidden md:block absolute top-10 -left-3 w-6 border-t border-dashed border-[#c9963a]/40"
                  aria-hidden
                />
              )}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#c9963a] font-display text-[#e8c46a]">
                {i + 1}
              </div>
              <p className="mt-4 text-4xl">{s.icon}</p>
              <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-xs text-white/50">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div
          className="rounded-2xl border border-[#c9963a]/20 p-8 md:p-10"
          style={{
            background: 'linear-gradient(135deg, rgba(26,61,28,0.3), rgba(11,26,13,0.5))'
          }}
        >
          <h2 className="font-display text-2xl text-[#e8c46a]">🌿 Count Cesare Mattei ke Siddhant</h2>
          <p className="mt-4 font-tagline text-xl italic text-white/70">&quot;Sharir = Rakt (Blood) + Lymph&quot;</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-display text-[#e8c46a]">Sanguine</p>
              <p className="text-sm text-white/55 mt-1">Blood system — disease vitiation</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-display text-[#e8c46a]">Lymphatic</p>
              <p className="text-sm text-white/55 mt-1">Lymph system — disease vitiation</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-[#c9963a]/25 bg-[#c9963a]/5 p-4 text-sm">
            <p className="font-semibold text-[#e8c46a]">⚡ Polarity Law</p>
            <p className="mt-2 text-white/65">Positive Rog → Negative Medicine</p>
            <p className="text-white/65">Negative Rog → Positive Medicine</p>
            <p className="mt-3 text-white/50">Hamara system yahi rules follow karta hai — automatically!</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl text-[#e8c46a] mb-12">Plans aur Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
          <PricingCard
            name="FREE TRIAL"
            price="14 Din"
            sub="Sab features unlocked"
            features={['All Pro features', 'No credit card', 'Full CDSS']}
            cta="Shuru Karen"
            to="/register"
          />
          <PricingCard
            name="BASIC"
            price="₹699"
            sub="/ mahina · 100 patients"
            features={['Core CDSS', 'Prescriptions', 'Reports']}
            notIncluded={['Unlimited patients', 'Book OCR']}
            cta="Chunein"
            to="/register"
            variant="basic"
          />
          <PricingCard
            name="PRO"
            price="₹1499"
            sub="/ mahina · Unlimited"
            popular
            features={['All features', 'Unlimited patients', '10 languages', 'Book library']}
            cta="Chunein ★"
            to="/register"
            variant="pro"
          />
        </div>
        <p className="text-center mt-8 text-sm text-white/45">
          Yearly: Basic ₹6,999/saal · Pro ₹14,999/saal — 2 mahine free!
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#0b1a0d]/60 py-20 px-4 overflow-hidden">
        <h2 className="text-center font-display text-3xl text-[#e8c46a] mb-12">Doctors Kya Kehte Hain?</h2>
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 md:overflow-visible">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="min-w-[280px] snap-center flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-6 md:min-w-0"
            >
              <p className="text-[#e8c46a]">⭐⭐⭐⭐⭐</p>
              <p className="mt-3 text-sm text-white/70 italic leading-relaxed">&quot;{t.text}&quot;</p>
              <footer className="mt-4 text-sm">
                <p className="font-medium text-white">👤 {t.name}</p>
                <p className="text-white/45 text-xs">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-20">
        <h2 className="text-center font-display text-3xl text-[#e8c46a] mb-10">Aksar Pooche Jane Wale Sawaal</h2>
        {FAQ.map((item) => (
          <FaqItem key={item.q} item={item} />
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div
          className="rounded-2xl border border-[#c9963a]/20 px-6 py-14 text-center"
          style={{ background: 'linear-gradient(135deg, #0a1a0b, #1a3d1c, #0a1a0b)' }}
        >
          <h2 className="font-display text-3xl text-white">Abhi Shuru Karen</h2>
          <p className="mt-3 text-white/65">Apni EH Practice ko Digital Banayein</p>
          <p className="text-sm text-white/45">Aaj hi Free Trial Shuru Karen</p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-lg bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] px-10 py-4 text-lg font-semibold text-white shadow-[0_8px_32px_rgba(74,155,84,0.3)]"
          >
            🚀 14 Din Free Trial — Abhi Shuru
          </Link>
          <p className="mt-4 text-xs text-white/40">No Credit Card · Cancel Anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-white/10 bg-[#060d07] px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          <div>
            <CaduceusLogo size={48} />
            <p className="mt-3 font-display text-[#e8c46a]">AROGYA SUTRA</p>
            <p className="font-tagline italic text-white/50">आरोग्य सूत्र</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Links</p>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <Link to="/login">Sign In</Link>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Contact</p>
            <p className="text-sm text-white/60">📞 9098791989</p>
            <p className="text-sm text-white/60">📧 contact@eharogyasutra.com</p>
            <p className="text-sm text-white/60">📍 Seoni, Madhya Pradesh</p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/35">
          <p>© 2026 E.H. Arogya Sutra · Jagdamba Clinic, Seoni</p>
          <p className="mt-1">Count Cesare Mattei ke Siddhanton par</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, price, sub, features, notIncluded = [], cta, to, popular, variant }) {
  const base =
    variant === 'pro'
      ? 'site-pricing-pro rounded-2xl p-6 relative'
      : variant === 'basic'
        ? 'rounded-2xl border border-[#4a9b54]/20 bg-[#2d6a35]/10 p-6'
        : 'rounded-2xl border border-white/10 bg-white/[0.03] p-6';

  return (
    <div className={base}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9963a] px-3 py-0.5 text-[10px] font-bold text-[#060d07]">
          Most Popular
        </span>
      )}
      <p className="font-display text-sm text-[#c9963a]">{name}</p>
      <p className="mt-2 font-display text-3xl text-white">{price}</p>
      <p className="text-xs text-white/45">{sub}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="text-emerald-300/90">
            ✅ {f}
          </li>
        ))}
        {notIncluded.map((f) => (
          <li key={f} className="text-white/30">
            ❌ {f}
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold ${
          popular
            ? 'bg-gradient-to-r from-[#c9963a] to-[#e8c46a] text-[#060d07]'
            : 'border border-white/20 text-white/80 hover:bg-white/5'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
