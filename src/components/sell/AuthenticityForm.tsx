'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShieldCheck, ReceiptText } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';
import { Button } from '@/components/ui/button';
import { Step7AuthenticitySchema } from '@/lib/listings/validators';
import { saveDraft } from '@/lib/listings/actions';

interface AuthenticityFormProps {
  initial: {
    authenticity_confirmed: boolean;
    has_receipt: boolean;
    serial_number: string | null;
  };
}

export function AuthenticityForm({ initial }: AuthenticityFormProps) {
  const t = useTranslations('sell.step.authenticity');
  const tErr = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [confirmed, setConfirmed] = useState(initial.authenticity_confirmed);
  const [hasReceipt, setHasReceipt] = useState(initial.has_receipt);
  const [serial, setSerial] = useState(initial.serial_number ?? '');
  const [error, setError] = useState<string | null>(null);

  function continueNext() {
    const parsed = Step7AuthenticitySchema.safeParse({
      authenticity_confirmed: confirmed,
      has_receipt: hasReceipt,
      serial_number: serial.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'authenticity_required');
      return;
    }
    setError(null);
    startTransition(async () => {
      await saveDraft({
        authenticity_confirmed: parsed.data.authenticity_confirmed,
        has_receipt: parsed.data.has_receipt,
        serial_number: parsed.data.serial_number ?? null,
        current_step: 'preview',
      });
      router.push('/sell/preview');
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-warm-amber/5 border border-warm-amber/25">
        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-warm-amber/15 text-warm-amber-700 shrink-0">
          <ShieldCheck className="size-4" />
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <p className="text-body font-medium text-charcoal-ink">{t('headline')}</p>
          <p className="text-body-small text-muted-steel">{t('subheadline')}</p>
        </div>
      </div>

      {/* Required: statement checkbox */}
      <label
        htmlFor="authenticity_confirmed"
        className="flex items-start gap-3 p-4 rounded-2xl border-[1.5px] border-ghost-border bg-pure-surface cursor-pointer select-none has-[:checked]:border-warm-amber has-[:checked]:bg-warm-amber/5"
      >
        <Checkbox
          id="authenticity_confirmed"
          checked={confirmed}
          onCheckedChange={state => setConfirmed(state === true)}
          size="lg"
          aria-required="true"
        />
        <span className="flex flex-col gap-1">
          <span className="text-body font-medium text-charcoal-ink">
            {t('statementHeadline')}
          </span>
          <span className="text-body-small text-muted-steel leading-relaxed">
            {t('statementBody')}
          </span>
        </span>
      </label>

      {/* Optional: receipt */}
      <label
        htmlFor="has_receipt"
        className="flex items-start gap-3 p-4 rounded-2xl border-[1.5px] border-ghost-border bg-pure-surface cursor-pointer select-none has-[:checked]:border-warm-amber has-[:checked]:bg-warm-amber/5"
      >
        <Checkbox
          id="has_receipt"
          checked={hasReceipt}
          onCheckedChange={state => setHasReceipt(state === true)}
          size="md"
        />
        <span className="flex items-start gap-2 flex-1">
          <ReceiptText className="size-4 text-muted-steel mt-1" aria-hidden="true" />
          <span className="flex flex-col gap-0.5">
            <span className="text-body text-charcoal-ink">{t('receiptLabel')}</span>
            <span className="text-caption text-muted-steel">{t('receiptHint')}</span>
          </span>
        </span>
      </label>

      {/* Optional: serial number */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="serial_number">{t('serialLabel')}</Label>
        <Input
          id="serial_number"
          name="serial_number"
          value={serial}
          onChange={e => setSerial(e.target.value)}
          maxLength={100}
          dir="ltr"
          placeholder={t('serialPlaceholder')}
          disabled={isPending}
        />
        <FormMessage tone="help">{t('serialHint')}</FormMessage>
      </div>

      {error && <FormMessage tone="error">{tErr(error)}</FormMessage>}

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isPending}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
