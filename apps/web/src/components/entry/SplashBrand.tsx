import { EHAS2Logo } from '../brand/EHAS2Logo';

type SplashBrandProps = {
  statusText?: string;
};

export function SplashBrand({ statusText = 'Preparing UI preview…' }: SplashBrandProps) {
  return (
    <div className="ehas2-splash__brand">
      <EHAS2Logo size={96} priority />
      <h1 className="ehas2-splash__title">E.H. AROGYA SUTRA 2</h1>
      <p className="ehas2-splash__subtitle ehas2-hindi">आरोग्य सूत्र २</p>
      <p className="ehas2-splash__tag">9 Rule Clinical Platform</p>
      <div className="ehas2-splash__loader" aria-hidden="true" />
      <p role="status" aria-live="polite">
        {statusText}
      </p>
    </div>
  );
}
