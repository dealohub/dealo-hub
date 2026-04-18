'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomSheet — Radix Dialog styled as a mobile bottom sheet.
 *
 * Usage:
 *   <BottomSheet>
 *     <BottomSheetTrigger asChild><Button>Open</Button></BottomSheetTrigger>
 *     <BottomSheetContent>
 *       <BottomSheetHeader>...</BottomSheetHeader>
 *       ...
 *       <BottomSheetFooter>...</BottomSheetFooter>
 *     </BottomSheetContent>
 *   </BottomSheet>
 */

export const BottomSheet = Dialog.Root;
export const BottomSheetTrigger = Dialog.Trigger;
export const BottomSheetClose = Dialog.Close;
export const BottomSheetPortal = Dialog.Portal;

export const BottomSheetOverlay = forwardRef<
  ElementRef<typeof Dialog.Overlay>,
  ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-charcoal-ink/40 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = 'BottomSheetOverlay';

type BottomSheetContentProps = Omit<ComponentPropsWithoutRef<typeof Dialog.Content>, 'title'> & {
  /** When true, content fills full viewport height. Default: auto-height with max-h-[90vh]. */
  fullHeight?: boolean;
  /** Accessible title (required by Radix; visually hidden if hideTitle). */
  title?: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
};

export const BottomSheetContent = forwardRef<
  ElementRef<typeof Dialog.Content>,
  BottomSheetContentProps
>(({ className, children, fullHeight, title, hideTitle, description, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex flex-col',
        'bg-pure-surface rounded-t-2xl shadow-[0_-8px_32px_rgba(24,24,27,0.16)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
        'data-[state=open]:duration-300 data-[state=closed]:duration-200',
        fullHeight ? 'h-[100dvh]' : 'max-h-[90dvh]',
        className
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1 shrink-0">
        <div className="h-1 w-10 rounded-full bg-zinc-300" aria-hidden="true" />
      </div>
      {title ? (
        hideTitle ? (
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
        ) : null
      ) : null}
      {description ? <Dialog.Description className="sr-only">{description}</Dialog.Description> : null}
      {children}
    </Dialog.Content>
  </BottomSheetPortal>
));
BottomSheetContent.displayName = 'BottomSheetContent';

export function BottomSheetHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-5 py-3 border-b border-whisper-divider shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BottomSheetTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Dialog.Title className={cn('text-heading-3 font-semibold text-charcoal-ink', className)}>
      {children}
    </Dialog.Title>
  );
}

export function BottomSheetDismiss({ label }: { label: string }) {
  return (
    <Dialog.Close
      className="flex items-center justify-center size-9 rounded-full text-muted-steel hover:bg-zinc-100 transition-colors"
      aria-label={label}
    >
      <X className="size-5" />
    </Dialog.Close>
  );
}

export function BottomSheetBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)}>{children}</div>;
}

export function BottomSheetFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-5 py-3 border-t border-whisper-divider shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}
