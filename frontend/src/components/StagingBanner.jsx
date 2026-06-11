/** Visible on staging builds — mock data only */
export default function StagingBanner() {
  const env = import.meta.env.VITE_APP_ENV || '';
  if (env !== 'staging') return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b border-amber-500/50 bg-amber-950/95 px-4 py-2 text-center text-sm font-medium text-amber-200"
    >
      STAGING — Mock patients only. Not production. Formula/summary changes tested here before live.
    </div>
  );
}
