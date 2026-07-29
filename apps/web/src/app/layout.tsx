import type { Metadata } from 'next';
import '@ehas2/design-system/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'E.H. AROGYA SUTRA 2',
  description: 'Clinical SaaS platform — engineering foundation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
