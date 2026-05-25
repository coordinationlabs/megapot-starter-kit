/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-deposit
 * @customize  Open/Closed badge + capacity. Closed when
 *             lpPoolTotal + pendingDeposits >= lpPoolCap. Pure display —
 *             data comes from useLpInfo.
 * ---
 */
import { UsdcAmount } from '@/components/common/UsdcAmount';

export function PoolStatus({
  poolCap,
  poolTotal,
  pendingDeposits,
  remainingCapacity,
  isClosed,
}: {
  poolCap: bigint | undefined;
  poolTotal: bigint | undefined;
  pendingDeposits: bigint | undefined;
  remainingCapacity: bigint | undefined;
  isClosed: boolean | undefined;
}) {
  return (
    <section className="card-pad">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">
          Liquidity pool <span className="text-xs font-medium text-zinc-500">USDC</span>
        </h2>
        <span
          className={
            'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
            (isClosed
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
              : 'bg-brand-primary-100 text-brand-primary-800 dark:bg-brand-primary-900/60 dark:text-brand-primary-200')
          }
        >
          {isClosed === undefined ? '…' : isClosed ? 'Closed' : 'Open'}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Pool total</dt>
          <dd className="font-mono tabular-nums">
            <UsdcAmount value={poolTotal} precision={0} unit={false} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Cap</dt>
          <dd className="font-mono tabular-nums">
            <UsdcAmount value={poolCap} precision={0} unit={false} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Pending deposits</dt>
          <dd className="font-mono tabular-nums">
            <UsdcAmount value={pendingDeposits} precision={0} unit={false} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Capacity left</dt>
          <dd className="font-mono tabular-nums">
            <UsdcAmount value={remainingCapacity} precision={0} unit={false} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
