/**
 * ---
 * @skill      https://llms.megapot.io/tasks/claim-referral-fees
 * @customize  Operator earnings widget. Shows accumulated USDC for the
 *             connected wallet and a Claim button when > 0. The protocol
 *             enforces msg.sender == referrer at claim time, so this works
 *             whether the connected user is the kit's REFERRER_ADDRESS or
 *             any address that has earned referrals.
 * ---
 */
import { useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { useClaimReferralFees } from '@/hooks/useClaimReferralFees';
import { useConfirmedFlash } from '@/hooks/useConfirmedFlash';

export function ClaimReferralFees() {
  const fees = useClaimReferralFees();
  const flashing = useConfirmedFlash(fees.isSuccess, fees.reset);

  // Refetch the referral-fees read on success (USDC balance is covered by
  // its own event watcher). Reset is deferred to `useConfirmedFlash` so the
  // "✓ Claimed!" pulse stays visible for ~2s.
  useEffect(() => {
    if (fees.isSuccess) fees.refetch();
  }, [fees.isSuccess, fees.refetch]);

  // Keep the section mounted while the flash plays — once it ends the
  // refetched zero-balance + reset combine to unmount cleanly.
  if (!fees.hasEarnings && !fees.isPending && !flashing) return null;

  return (
    <section className="space-y-2 rounded-2xl border border-brand-primary-300 bg-brand-primary-50 p-4 dark:border-brand-primary-900 dark:bg-brand-primary-950/40">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-primary-900 dark:text-brand-primary-100">
          Referral earnings
        </p>
        <span className="text-lg font-semibold tabular-nums">
          <UsdcAmount value={fees.earned} precision={2} />
        </span>
      </div>
      <p className="text-xs text-brand-primary-800 dark:text-brand-primary-200">
        Earned from tickets sold + winnings claimed through this app's referrer address.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={fees.claim}
        disabled={fees.isPending || flashing || !fees.hasEarnings}
        className="w-full"
      >
        {fees.isWaitingSignature
          ? 'Sign in your wallet…'
          : fees.isMining
            ? 'Confirming on-chain…'
            : flashing
              ? '✓ Claimed!'
              : 'Claim earnings'}
      </Button>
      <TxStatus
        hash={fees.txHash}
        isPending={fees.isPending}
        isSuccess={fees.isSuccess}
        error={fees.error}
      />
    </section>
  );
}
