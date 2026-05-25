/**
 * ---
 * @customize  USDC has 6 decimals on Base. Override `precision` for more
 *             granularity. Pass `compact` to format large values as "12.4K".
 *             Pass `unit={false}` when the USDC label is already conveyed by
 *             the surrounding context (e.g. a column header).
 * ---
 */
import { formatUnits } from 'viem';
import { USDC_DECIMALS } from '@/config/contracts';

export function UsdcAmount({
  value,
  precision = 2,
  compact = false,
  unit = true,
  className,
}: {
  value: bigint | undefined;
  precision?: number;
  compact?: boolean;
  unit?: boolean;
  className?: string;
}) {
  if (value === undefined) {
    return <span className={className}>—</span>;
  }

  const n = Number(formatUnits(value, USDC_DECIMALS));
  const formatted = compact
    ? new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n)
    : new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(n);

  return (
    <span className={className}>
      ${formatted}
      {unit && <span className="ml-1 text-xs text-zinc-500">USDC</span>}
    </span>
  );
}
