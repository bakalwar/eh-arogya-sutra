import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E.H. Arogya Sutra — Clinical Practice App',
  description: 'Electrohomeopathy clinical decision support for E.H. practitioners',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
