import { useEffect, useState } from 'react';
import MatteiBrandMark from './website/MatteiBrandMark';
import '../styles/website.css';

const SESSION_KEY = 'eh_splash_brand_v1';

export default function SplashScreen({ onComplete }) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOut(true);
      setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          /* ignore */
        }
        onComplete?.();
      }, 420);
    }, 1700);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className={`site-splash fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060d07] transition-opacity duration-500 ${
        out ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden
    >
      <div className="site-splash-shimmer absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9963a] to-transparent opacity-80" />
      <MatteiBrandMark layout="column" size="xl" titleAs="p" />
      <p className="site-fade-up site-delay-1 mt-8 font-tagline text-lg italic text-[#c9963a]/90">आरोग्य सूत्र</p>
      <p className="site-fade-up site-delay-2 mt-2 text-xs tracking-[0.35em] text-white/40">ELECTRO HOMOEOPATHY</p>
    </div>
  );
}
