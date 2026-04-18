'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * OtpInput — 6-box OTP input with auto-advance, paste, and shake-on-error.
 *
 * Behavior:
 *   - Digit-only (pattern=\d). Non-digits rejected on input.
 *   - Auto-advance focus on digit entry.
 *   - Backspace steps back if current cell empty.
 *   - Paste anywhere spreads digits across cells (auto-trims to 6).
 *   - onComplete fires once all 6 cells populated.
 *   - `error` prop triggers a 2-cycle shake via CSS animation.
 *
 * Sprint 1: mounted on /verify-otp page for BOTH email magic-link confirmations
 * (if we do numeric confirm) AND future phone OTP — same UI, different backend.
 */

interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  /** Hidden field name for non-JS fallback submission. */
  name?: string;
}

export function OtpInput({
  length = 6,
  onComplete,
  error,
  disabled,
  autoFocus = true,
  ariaLabel = 'Verification code',
  name = 'otp',
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
  const [shakeCount, setShakeCount] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Trigger a re-shake whenever `error` flips true.
  useEffect(() => {
    if (error) setShakeCount(c => c + 1);
  }, [error]);

  useEffect(() => {
    if (autoFocus && refs.current[0] && !disabled) {
      refs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const joined = useMemo(() => digits.join(''), [digits]);

  function updateDigit(index: number, value: string) {
    // Accept last character only, must be digit 0-9.
    const digit = value.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    const full = next.join('');
    if (full.length === length && next.every(Boolean)) {
      onComplete?.(full);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        refs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
      return;
    }

    // Arrow keys navigate regardless of dir (OTP is always LTR digits).
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();

    const next = Array(length).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);

    const lastIndex = Math.min(text.length, length) - 1;
    refs.current[lastIndex]?.focus();

    if (text.length === length) onComplete?.(text);
  }

  return (
    <div className="w-full">
      <div
        role="group"
        aria-label={ariaLabel}
        dir="ltr"
        className={cn(
          'flex items-center justify-center gap-2',
          shakeCount > 0 && 'animate-shake'
        )}
        key={shakeCount}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`${ariaLabel} digit ${index + 1}`}
            aria-invalid={error || undefined}
            onChange={e => updateDigit(index, e.target.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={e => e.currentTarget.select()}
            className={cn(
              'w-12 h-14 sm:w-14 sm:h-16 text-center rounded-xl',
              'bg-pure-surface border-[1.5px] border-ghost-border',
              'font-mono text-2xl font-semibold text-charcoal-ink tabular-nums',
              'transition-[border,box-shadow,background] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              'focus:outline-none focus:border-warm-amber focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]',
              digit && 'bg-pure-surface border-warm-amber/60',
              error &&
                'border-danger-coral focus:border-danger-coral focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          />
        ))}
      </div>

      {/* Hidden field mirrors joined value for non-JS form submissions. */}
      <input type="hidden" name={name} value={joined} />
    </div>
  );
}
