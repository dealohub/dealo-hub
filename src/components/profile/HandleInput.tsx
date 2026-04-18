'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { checkHandleAvailabilityAction } from '@/lib/profile/actions';
import { cn } from '@/lib/utils';

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid';

interface HandleInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'defaultValue' | 'size'> {
  defaultValue?: string;
  /** Field-level error i18n key (set by parent form on submit). */
  fieldError?: string | null;
  label?: string;
}

/**
 * HandleInput — debounced availability check + inline status indicator.
 *
 * Lowercase-locked, 3–20 alnum/underscore. Skips the network check for the
 * user's currently-saved handle so editing your own profile doesn't show
 * "taken" for yourself.
 */
export const HandleInput = forwardRef<HTMLInputElement, HandleInputProps>(
  ({ defaultValue = '', fieldError, label, className, ...props }, ref) => {
    const t = useTranslations('profile.edit');
    const tErr = useTranslations('profile.errors');
    const [value, setValue] = useState<string>(defaultValue);
    const [status, setStatus] = useState<Availability>('idle');
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const originalRef = useRef<string>(defaultValue);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    function onChange(e: ChangeEvent<HTMLInputElement>) {
      const next = e.target.value.toLowerCase();
      setValue(next);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (next === '' || next === originalRef.current) {
        setStatus('idle');
        return;
      }

      if (!/^[a-z0-9_]{3,20}$/.test(next)) {
        setStatus('invalid');
        return;
      }

      setStatus('checking');
      timeoutRef.current = setTimeout(async () => {
        const res = await checkHandleAvailabilityAction(next);
        if (res.available) {
          setStatus('available');
        } else {
          setStatus(res.reason === 'reserved' ? 'reserved' : res.reason === 'invalid' ? 'invalid' : 'taken');
        }
      }, 400);
    }

    const statusTone =
      status === 'available' ? 'success' : status === 'checking' || status === 'idle' ? 'help' : 'error';
    const statusMessage = (() => {
      switch (status) {
        case 'checking':
          return t('handleChecking');
        case 'available':
          return t('handleAvailable');
        case 'taken':
          return tErr('handle_taken');
        case 'reserved':
          return tErr('handle_reserved');
        case 'invalid':
          return tErr('handle_invalid_format');
        default:
          return null;
      }
    })();

    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={props.id ?? 'handle'}>{label}</Label>}

        <div className="relative">
          <span
            className="
              absolute inset-y-0 start-3 flex items-center
              text-muted-steel font-mono
              pointer-events-none select-none
            "
            aria-hidden="true"
          >
            @
          </span>
          <Input
            ref={ref}
            id={props.id ?? 'handle'}
            name="handle"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            dir="ltr"
            value={value}
            onChange={onChange}
            error={!!fieldError || status === 'taken' || status === 'reserved' || status === 'invalid'}
            className={cn('ps-8', className)}
            {...props}
          />
          <span className="absolute inset-y-0 end-3 flex items-center" aria-hidden="true">
            {status === 'checking' && <Loader2 className="size-4 text-muted-steel animate-spin" />}
            {status === 'available' && <CheckCircle2 className="size-4 text-success-sage" />}
            {(status === 'taken' || status === 'reserved' || status === 'invalid') && (
              <AlertCircle className="size-4 text-danger-coral" />
            )}
          </span>
        </div>

        {fieldError ? (
          <FormMessage tone="error">{tErr(fieldError)}</FormMessage>
        ) : statusMessage ? (
          <FormMessage tone={statusTone}>{statusMessage}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('handleHint')}</FormMessage>
        )}
      </div>
    );
  }
);

HandleInput.displayName = 'HandleInput';
