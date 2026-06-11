/**
 * Count Cesare Mattei portrait (circular) + rotating gold ring + AROGYA/SUTRA wordmark.
 * Photo: /count-mattei.jpg (public)
 */
export default function MatteiBrandMark({
  layout = 'column',
  size = 'lg',
  showSubtitle = false,
  titleAs: TitleTag = 'p',
  className = ''
}) {
  const sizes = {
    sm: 44,
    md: 88,
    lg: 132,
    xl: 168
  };
  const px = sizes[size] || sizes.lg;
  const outer = px + Math.round(px * 0.08);
  const titleSm = size === 'sm' ? 'text-base sm:text-lg leading-none' : '';
  const titleMd = size === 'md' ? 'text-2xl sm:text-3xl' : '';
  const titleLg = size === 'lg' ? 'text-4xl sm:text-5xl md:text-6xl' : '';
  const titleXl = size === 'xl' ? 'text-5xl sm:text-6xl md:text-7xl' : '';
  const titleClass = [titleSm, titleMd, titleLg, titleXl].filter(Boolean).join(' ') || titleLg;

  const mark = (
    <div
      className="site-mattei-spin flex items-center justify-center rounded-full shrink-0"
      style={{ width: outer, height: outer }}
    >
      <div
        className="site-mattei-photo flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: px, height: px }}
      >
        <img src="/count-mattei.jpg" alt="Count Cesare Mattei" className="h-full w-full object-cover object-top" loading="lazy" />
      </div>
    </div>
  );

  const wordmark = (
    <div className={layout === 'column' ? 'text-center' : 'text-left min-w-0'}>
      <TitleTag
        className={`font-display font-semibold tracking-[0.08em] ${titleClass} ${TitleTag === 'h1' ? 'm-0' : ''} block`}
      >
        <span className="text-white">AROGYA</span>
        <span className="text-white/90"> </span>
        <span className="text-[#e8c46a]">SUTRA</span>
      </TitleTag>
      {showSubtitle && (
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/45">E.H. Practitioner Platform</p>
      )}
    </div>
  );

  if (layout === 'row') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {mark}
        {wordmark}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {mark}
      {wordmark}
    </div>
  );
}
