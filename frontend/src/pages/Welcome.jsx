import { useEffect, useId, useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, clearSession, getCurrentUser } from '../security/tokenManager';
import '../styles/eh-arogya-mock.css';

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = useId().replace(/:/g, '');
  /** Skip animated splash if global brand splash (main.jsx) already ran this session */
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem('eh_splash_brand_v1') === '1') return 'cta';
    } catch {
      /* ignore */
    }
    return 'splash';
  });
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    document.title = `${t('welcome.title')} — EH CDSS`;
    const fresh = searchParams.get('start') === '1' || searchParams.get('fresh') === '1';
    if (fresh) clearSession();
    setBooted(true);
  }, [t, searchParams]);

  /** If CSS animationend never fires (reduced motion, browser quirks), still show CTA — avoids blank screen */
  useEffect(() => {
    if (phase !== 'splash') return undefined;
    let cancelled = false;
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) {
      setPhase('cta');
      return undefined;
    }
    const t = window.setTimeout(() => {
      if (!cancelled) setPhase((p) => (p === 'splash' ? 'cta' : p));
    }, 4400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [phase]);

  if (!booted) return null;

  if (isAuthenticated()) {
    const user = getCurrentUser();
    const dest =
      user?.role === 'super_admin'
        ? '/super-admin/overview'
        : user?.role === 'admin'
          ? '/admin'
          : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  const gid1 = `sp1-${uid}`;
  const gid2 = `spw-${uid}`;
  const gid3 = `spg-${uid}`;

  function onSplashEnd(e) {
    if (e.animationName !== 'splashOut') return;
    setPhase('cta');
  }

  return (
    <div className="eh-mock-root">
      {phase === 'splash' && (
        <div className="splash" onAnimationEnd={onSplashEnd}>
          <div className="splash-glow" />
          <div className="splash-topline" />

          <div className="sp-logo">
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 18px rgba(201,150,58,0.4))' }}>
              <circle cx="50" cy="50" r="47" stroke="#c9963a" strokeWidth="1" opacity="0.4" />
              <circle cx="50" cy="50" r="39" stroke="#c9963a" strokeWidth="0.5" opacity="0.2" />
              <line x1="50" y1="16" x2="50" y2="84" stroke={`url(#${gid1})`} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M50 24 C41 17 26 19 23 26 C30 22 42 25 50 31" fill={`url(#${gid2})`} opacity="0.95" />
              <path d="M50 24 C59 17 74 19 77 26 C70 22 58 25 50 31" fill={`url(#${gid2})`} opacity="0.95" />
              <path d="M50 31 C43 37 39 44 42 51 C45 57 42 64 37 70" stroke={`url(#${gid3})`} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M50 31 C57 37 61 44 58 51 C55 57 58 64 63 70" stroke={`url(#${gid3})`} strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="37" cy="72" r="2.5" fill="#4a9b54" />
              <circle cx="63" cy="72" r="2.5" fill="#4a9b54" />
              <path d="M50 43 L54 50 L50 57 L46 50Z" fill="#e8c46a" opacity="0.9" />
              <path d="M44 50 L50 46 L56 50 L50 54Z" fill="#c9963a" opacity="0.7" />
              <circle cx="50" cy="50" r="3" fill="#f5e4b0" />
              <circle cx="50" cy="3" r="2" fill="#c9963a" opacity="0.7" />
              <circle cx="50" cy="97" r="2" fill="#c9963a" opacity="0.7" />
              <defs>
                <linearGradient id={gid1} x1="50" y1="16" x2="50" y2="84" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e8c46a" />
                  <stop offset="100%" stopColor="#8B6320" />
                </linearGradient>
                <linearGradient id={gid2} x1="23" y1="19" x2="77" y2="31" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8B6320" />
                  <stop offset="50%" stopColor="#e8c46a" />
                  <stop offset="100%" stopColor="#8B6320" />
                </linearGradient>
                <linearGradient id={gid3} x1="50" y1="31" x2="50" y2="72" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2d6a35" />
                  <stop offset="100%" stopColor="#6abf72" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="sp-eh">{t('welcome.ehLine')}</div>
          <div className="sp-name">
            {t('welcome.titleLine1')} &nbsp;<span className="g">{t('welcome.titleLine2')}</span>
          </div>
          <div className="sp-deva">{t('welcome.deva')}</div>
          <div className="sp-line" />
          <div className="sp-tag">{t('welcome.tagline')}</div>
          <div className="sp-pract">{t('welcome.practitioner')}</div>
          <div className="sp-loader">
            <div className="sp-loader-fill" />
          </div>
          <div className="sp-mattei">{t('welcome.footer')}</div>
        </div>
      )}

      {phase === 'cta' && (
        <div className="eh-welcome-cta">
          <div className="eh-welcome-cta-inner">
            <div className="sp-eh">{t('welcome.ehLine')}</div>
            <div className="sp-name">
              {t('welcome.titleLine1')} &nbsp;<span className="g">{t('welcome.titleLine2')}</span>
            </div>
            <div className="sp-deva">{t('welcome.deva')}</div>
            <div className="sp-line" style={{ marginTop: '14px' }} />
            <div className="sp-tag" style={{ marginTop: '8px' }}>
              {t('welcome.tagline')}
            </div>
            <div className="eh-welcome-actions">
              <button type="button" className="btn-new" onClick={() => navigate('/login')}>
                {t('welcome.ctaLogin')}
              </button>
              <button type="button" className="eh-welcome-skip" onClick={() => navigate('/login', { replace: true })}>
                {t('welcome.skipIntro')}
              </button>
            </div>
            <button
              type="button"
              className="eh-welcome-skip"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate('/website')}
            >
              {i18n.language === 'hi' ? '↗ सुविधाएँ व प्लान (वेबसाइट)' : '↗ Features & pricing (website)'}
            </button>
            <p style={{ marginTop: '1.25rem', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
              {i18n.language === 'hi' ? 'लाइव ऐप: पहले npm run dev और npm run dev:web चलाएँ' : 'Live app: run npm run dev and npm run dev:web first'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
