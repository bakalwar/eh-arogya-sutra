import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children?: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`ehas2-btn ehas2-btn--${variant} ${className}`.trim()}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children?: ReactNode;
};

export function IconButton({ label, className = '', children, ...rest }: IconButtonProps) {
  return (
    <button
      className={`ehas2-btn ehas2-btn--ghost ehas2-icon-btn ${className}`.trim()}
      type="button"
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
