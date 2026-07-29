'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { applyOtpPaste } from '../../lib/authPreview';

type OTPInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
};

export function OTPInput({ value, onChange, disabled, error }: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, digit: string) {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    const digit = raw.slice(-1);
    setDigit(index, digit);
    refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const next = applyOtpPaste(event.clipboardData.getData('text'));
    if (next.every((d) => !d)) return;
    onChange(next);
    const filled = next.filter(Boolean).length;
    const focusIndex = Math.min(Math.max(filled - 1, 0), 5);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="ehas2-field">
      <label id="otp-label">One-time password</label>
      <div className="ehas2-otp" role="group" aria-labelledby="otp-label">
        {value.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of 6`}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {error ? (
        <p className="ehas2-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
