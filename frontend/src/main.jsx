import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';
import SplashScreen from './components/SplashScreen.jsx';

// Service worker caches old bundles — never register in dev; purge if leftover from prod test
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

function Boot() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('eh_splash_brand_v1');
    } catch {
      return true;
    }
  });

  return (
    <>
      <App />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boot />
  </StrictMode>
);
