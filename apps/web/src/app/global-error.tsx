'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Something went wrong</h1>
        <p>A safe error occurred in this UI preview. No stack details are shown.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}
