import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Plus_Jakarta_Sans, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import '@ehas2/design-system/tokens.css';
import '../styles/shell.css';
import '../styles/auth-dashboard.css';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-ehas2-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-ehas2-body',
  display: 'swap',
});

const hindi = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-ehas2-hindi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'E.H. AROGYA SUTRA 2',
  description: 'UI foundation — clinical engine not connected',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = {
    ['--ehas2-font-display']:
      'var(--font-ehas2-display), "Plus Jakarta Sans", system-ui, sans-serif',
    ['--ehas2-font-body']: 'var(--font-ehas2-body), Inter, system-ui, sans-serif',
    ['--ehas2-font-hindi']:
      'var(--font-ehas2-hindi), "Noto Sans Devanagari", Inter, system-ui, sans-serif',
  } as CSSProperties;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hindi.variable}`}>
      <body style={fontVars}>{children}</body>
    </html>
  );
}
