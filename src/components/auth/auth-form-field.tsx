import { forwardRef } from 'react';

/**
 * AuthFormField — labeled input with integrated error display.
 *
 * Accessibility:
 *   - label linked to input via htmlFor + id
 *   - aria-invalid + aria-describedby for error announcement
 *   - error region has role="alert"
 *
 * Errors are i18n-resolved by the parent (passed as a pre-localized string).
 */

type Props = {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  error?: string | null;
  hint?: string;
  dir?: 'ltr' | 'rtl';
};

const AuthFormField = forwardRef<HTMLInputElement, Props>(function AuthFormField(
  { id, name, label, type = 'text', placeholder, required, autoComplete, defaultValue, error, hint, dir },
  ref,
) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
      >
        {label}
        {required && <span className="ms-0.5 text-rose-500" aria-hidden="true">*</span>}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        dir={dir ?? (type === 'email' || type === 'tel' ? 'ltr' : undefined)}
        className={
          'block h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 transition focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
          (error
            ? 'border-rose-500/60 ring-1 ring-rose-500/30'
            : 'border-border/60 focus:border-primary/40')
        }
      />
      {hint && !error && (
        <p id={hintId} className="text-[11px] leading-snug text-foreground/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] leading-snug text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
});

export default AuthFormField;
