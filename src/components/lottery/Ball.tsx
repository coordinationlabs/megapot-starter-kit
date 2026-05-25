/**
 * ---
 * @customize  Single source of truth for the ball/number circle used across
 *             TicketCard, the History winning-numbers strip, the
 *             TicketBuilder random preview, and the TicketPicker grid.
 *             Edit the palette tokens here to rebrand every ball at once.
 *
 *             Variants:
 *               - normal — emerald palette when selected, neutral outline
 *                          when not.
 *               - bonus  — amber palette in both states.
 *             Sizes:
 *               - sm   — h-5 w-5 text-[11px] (random preview, tight rows)
 *               - md   — h-6 w-6 text-xs    (default; rows on Tickets/History)
 *               - fill — aspect-square w-full (picker grid cells)
 *             Set `interactive` to render as a focusable <button aria-pressed>;
 *             omit for a decorative <span>.
 * ---
 */
import type { CSSProperties } from 'react';

export type BallVariant = 'normal' | 'bonus';
export type BallSize = 'sm' | 'md' | 'fill';

const SIZE_CLASSES: Record<BallSize, string> = {
  sm: 'h-5 w-5 text-[11px]',
  md: 'h-6 w-6 text-xs',
  fill: 'aspect-square w-full text-sm',
};

const NORMAL_SELECTED =
  'border-brand-primary-500 bg-brand-primary-100 text-brand-primary-900 ' +
  'dark:border-brand-primary-500 dark:bg-brand-primary-900/60 dark:text-brand-primary-100';
const NORMAL_UNSELECTED = 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300';
const BONUS_SELECTED =
  'border-amber-500 bg-amber-100 text-amber-900 ' +
  'dark:border-amber-500 dark:bg-amber-900/60 dark:text-amber-100';
const BONUS_UNSELECTED =
  'border-amber-300 bg-amber-50 text-amber-800 ' +
  'dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200';

export type BallProps = {
  n: number | string;
  variant?: BallVariant;
  selected?: boolean;
  size?: BallSize;
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  title?: string;
  style?: CSSProperties;
};

export function Ball({
  n,
  variant = 'normal',
  selected = false,
  size = 'md',
  interactive = false,
  onClick,
  ariaLabel,
  className = '',
  title,
  style,
}: BallProps) {
  const palette =
    variant === 'bonus'
      ? selected
        ? BONUS_SELECTED
        : BONUS_UNSELECTED
      : selected
        ? NORMAL_SELECTED
        : NORMAL_UNSELECTED;

  const base =
    'inline-flex items-center justify-center rounded-full border ' +
    'font-mono tabular-nums transition-colors ' +
    SIZE_CLASSES[size] +
    ' ' +
    palette +
    (className ? ` ${className}` : '');

  if (interactive) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        aria-label={ariaLabel ?? String(n)}
        onClick={onClick}
        title={title}
        style={style}
        className={`${base} cursor-pointer hover:opacity-90 active:scale-95`}
      >
        {n}
      </button>
    );
  }

  return (
    <span title={title} style={style} className={base}>
      {n}
    </span>
  );
}
