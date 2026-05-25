/**
 * ---
 * @customize  Small modal primitive — portal to body, backdrop, ESC + click
 *             outside to close, body scroll lock while open. Mobile renders
 *             as a full-bleed bottom sheet; sm+ renders as a centered card
 *             capped at max-w-lg. No external dependency.
 *
 *             Mobile bottom sheet has a small pill at the top as a visual
 *             sheet-handle affordance (mobile-only via `sm:hidden`). It is
 *             purely decorative — swipe-to-dismiss is not wired; ESC,
 *             backdrop click, or a close button inside `children` are the
 *             three close paths. A fork that wants real drag/swipe can
 *             extend the dialog's `onMouseDown` / pointer handlers.
 *
 *             Focus management: on open, focuses the first interactive
 *             element inside. On close, restores focus to the element that
 *             was focused before opening. A lightweight focus trap loops
 *             Tab / Shift+Tab inside the dialog.
 * ---
 */
import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Body scroll lock + remember which element was focused before opening.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Focus first interactive element inside the dialog on open.
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus?.();
  }, [open]);

  // ESC closes; lightweight focus trap on Tab / Shift+Tab.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is supplemental — keyboard users use ESC or the close button inside the dialog
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={
          'flex max-h-[92vh] w-full flex-col overflow-hidden border border-zinc-200 ' +
          'bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 ' +
          'rounded-t-2xl sm:my-12 sm:max-w-lg sm:rounded-2xl'
        }
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden"
        />
        {children}
      </div>
    </div>,
    document.body,
  );
}
