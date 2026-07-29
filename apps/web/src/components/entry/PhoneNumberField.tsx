'use client';

import type { ChangeEvent } from 'react';

type PhoneNumberFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  countryCode?: string;
};

export function PhoneNumberField({
  id = 'doctor-mobile',
  value,
  onChange,
  error,
  disabled,
  countryCode = '+91',
}: PhoneNumberFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  }

  return (
    <div className="ehas2-field">
      <label htmlFor={id}>Mobile number</label>
      <div className="ehas2-field__control">
        <span className="ehas2-field__prefix" aria-hidden="true">
          {countryCode}
        </span>
        <input
          id={id}
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-digit mobile"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          maxLength={10}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="ehas2-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
