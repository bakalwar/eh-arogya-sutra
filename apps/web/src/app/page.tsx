'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SplashBrand } from '../components/entry/SplashBrand';
import { PUBLIC_ROUTES } from '../config/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Preparing UI preview…');

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStatus('Opening login preview…');
    const delay = reduced ? 0 : 1200;
    const timer = window.setTimeout(() => {
      router.replace(PUBLIC_ROUTES.login);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="ehas2-splash" id="main-content">
      <SplashBrand statusText={status} />
    </main>
  );
}
