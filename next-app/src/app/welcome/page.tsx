'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CaduceusLogo from '@/components/ui/CaduceusLogo';

export default function WelcomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'cta'>('splash');

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) {
      setPhase('cta');
      return undefined;
    }
    const timer = window.setTimeout(() => setPhase((p) => (p === 'splash' ? 'cta' : p)), 4400);
    return () => window.clearTimeout(timer);
  }, []);

  function onSplashEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.animationName === 'splashOut') setPhase('cta');
  }

  return (
    <div className="eh-mock-root">
      {phase === 'splash' ? (
        <div className="splash" onAnimationEnd={onSplashEnd}>
          <div className="splash-glow" />
          <div className="splash-topline" />

          <div className="sp-logo">
            <CaduceusLogo size={90} variant="splash" gradientPrefix="welcome" />
          </div>

          <div className="sp-eh">Electro · Homoeopathy</div>
          <div className="sp-name">
            AROGYA &nbsp;<span className="g">SUTRA</span>
          </div>
          <div className="sp-deva">आरोग्य सूत्र</div>
          <div className="sp-line" />
          <div className="sp-tag">&quot;Ancient Wisdom · Modern Precision&quot;</div>
          <div className="sp-pract">E.H. Practitioner Platform</div>
          <div className="sp-loader">
            <div className="sp-loader-fill" />
          </div>
          <div className="sp-mattei">Count Cesare Mattei · Est. 1850</div>
        </div>
      ) : (
        <div className="eh-welcome-cta">
          <div className="sp-eh">Electro · Homoeopathy</div>
          <div className="sp-name">
            AROGYA &nbsp;<span className="g">SUTRA</span>
          </div>
          <div className="sp-deva">आरोग्य सूत्र</div>
          <div className="sp-line" style={{ marginTop: 14 }} />
          <div className="sp-tag" style={{ marginTop: 8 }}>
            &quot;Ancient Wisdom · Modern Precision&quot;
          </div>

          <div className="eh-welcome-actions">
            <Link href="/login" className="btn-new">
              Doctor Login
            </Link>
            <Link href="/signup" className="eh-welcome-skip" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Sign Up
            </Link>
            <button type="button" className="eh-welcome-skip" onClick={() => router.push('/overview')}>
              Continue as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
