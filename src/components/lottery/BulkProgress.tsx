/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-bulk
 * @customize  Progress bar for an in-flight bulk order. Source of truth is
 *             `BatchOrderExecuted` event subscriptions in useBulkPurchase
 *             (live updates per batch settle).
 * ---
 */
import { UsdcAmount } from '@/components/common/UsdcAmount';

export function BulkProgress({
  totalTickets,
  remainingTickets,
  remainingUSDC,
}: {
  totalTickets: bigint;
  remainingTickets: bigint;
  remainingUSDC: bigint;
}) {
  const executed = totalTickets - remainingTickets;
  const pct = totalTickets === 0n ? 0 : Number((executed * 100n) / totalTickets);

  const done = remainingTickets === 0n;

  return (
    <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/50">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-indigo-900 dark:text-indigo-100">
          {done ? 'Batch order complete' : 'Batch order in progress'}
        </span>
        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
          {executed.toString()} / {totalTickets.toString()}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-indigo-700 dark:text-indigo-300">
          USDC left to spend: <UsdcAmount value={remainingUSDC} precision={2} />
        </span>
      </div>
    </div>
  );
}
