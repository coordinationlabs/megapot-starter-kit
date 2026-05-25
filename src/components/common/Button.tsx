/**
 * ---
 * @customize  Single button primitive — 3 variants cover every action
 *             surface in the kit. White-labeling a button style means
 *             editing the maps below; consumers stay unchanged.
 *
 *             Variants:
 *               - primary   — the brand CTA (Buy, Deposit, Claim, Finalize)
 *               - secondary — neutral / zinc (Approve, Initiate withdraw,
 *                             quiet confirmations)
 *               - danger    — destructive / error (Cancel, Wrong network)
 *
 *             Sizes:
 *               - sm — compact in-card actions
 *               - md — page-level submits (default)
 *               - lg — hero / page-level CTAs (e.g. Home "Play now")
 *
 *             To add a variant, append to `VARIANT_CLASSES` and the
 *             `Variant` union. Same for sizes. Consumers pass `variant`
 *             and `size`; pass-through `className` is appended last so a
 *             caller can override (e.g. `w-full`).
 * ---
 */
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary-600 text-white shadow-sm hover:bg-brand-primary-700 hover:shadow active:shadow-none',
  secondary:
    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-2 text-xs font-semibold',
  md: 'rounded-lg px-4 py-2.5 text-sm font-semibold',
  lg: 'rounded-xl px-6 py-4 text-base font-semibold',
};

const BASE_CLASSES = 'transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes =
    `${BASE_CLASSES} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`.trim();
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
