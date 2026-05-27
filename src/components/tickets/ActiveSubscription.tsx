/**
 * ---
 * @skill      https://llms.megapot.io/tasks/subscribe
 * @customize  Status card + Cancel button. Reads via getSubscriptionInfo;
 *             absence is signaled by the contract reverting with
 *             NoActiveSubscription() — useSubscribe handles that as the
 *             "no subscription" state.
 * ---
 */
import { useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { useConfirmedFlash } from '@/hooks/useConfirmedFlash';
import { useSubscribe } from '@/hooks/useSubscribe';

export function ActiveSubscription() {
  const sub = useSubscribe();
  const flashing = useConfirmedFlash(sub.cancel.isSuccess, sub.cancel.reset);

  // Refetch subscription info on cancel success so `hasActiveSubscription`
  // flips false at the next render. Reset is deferred to `useConfirmedFlash`
  // so the "✓ Cancelled" pulse stays visible for ~2s before the section
  // unmounts.
  useEffect(() => {
    if (sub.cancel.isSuccess) sub.refetchInfo();
  }, [sub.cancel.isSuccess, sub.refetchInfo]);

  // Stay mounted while flashing even if the underlying info read has flipped.
  if ((!sub.hasActiveSubscription || !sub.info) && !flashing) return null;
  if (!sub.info) return null;

  const { subscription, staticTickets } = sub.info;

  return (
    <section className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          Active subscription
        </p>
        <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300">
          {subscription.dynamicTicketCount.toString()} random + {staticTickets.length} custom
          tickets per drawing
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-indigo-700 dark:text-indigo-300">Remaining USDC</dt>
          <dd className="font-mono tabular-nums">
            <UsdcAmount value={subscription.remainingUSDC} precision={2} />
          </dd>
        </div>
        <div>
          <dt className="text-indigo-700 dark:text-indigo-300">Last drawing executed</dt>
          <dd className="font-mono">#{subscription.lastExecutedDrawing.toString()}</dd>
        </div>
      </dl>
      <Button
        variant="danger"
        size="sm"
        onClick={sub.cancelSubscription}
        disabled={sub.cancel.isPending || flashing}
        className="w-full"
      >
        {sub.cancel.isWaitingSignature
          ? 'Sign in your wallet…'
          : sub.cancel.isMining
            ? 'Confirming on-chain…'
            : flashing
              ? '✓ Cancelled'
              : 'Cancel subscription'}
      </Button>
      <TxStatus
        hash={sub.cancel.txHash}
        isPending={sub.cancel.isPending}
        isSuccess={sub.cancel.isSuccess}
        error={sub.cancel.error}
      />
      <p className="text-xs text-indigo-700 dark:text-indigo-300">
        Cancelling refunds the remaining USDC balance to your wallet.
      </p>
    </section>
  );
}
