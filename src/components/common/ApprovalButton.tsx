/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 * @customize  Generic USDC approve flow. Pass any `spender` so one wrapper
 *             works across Jackpot / BatchPurchaseFacilitator /
 *             JackpotAutoSubscription / JackpotLPManager. Approves the exact
 *             amount (no leftover allowance) — change to `maxUint256` for
 *             "approve once" UX at the cost of a larger trust surface.
 *
 *             Children-passthrough pattern. Wrap the downstream submit
 *             button inside `<ApprovalButton>`; when allowance is
 *             insufficient we render the Approve button instead of the
 *             children, so the user only ever sees one CTA at a time:
 *
 *               <ApprovalButton spender={addr} amount={cost}>
 *                 <Button variant="primary" onClick={submit}>Buy</Button>
 *               </ApprovalButton>
 *
 *             Children show through whenever:
 *               - wallet is disconnected
 *               - amount is 0n (nothing to approve yet)
 *               - allowance query is still loading
 *               - allowance is already ≥ amount
 *
 *             so the submit CTA stays visible (and the parent can keep it
 *             disabled via its own guard) in every state except the brief
 *             "approval required" gate.
 * ---
 */
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { erc20Abi } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { USDC_ADDRESS } from '@/config/contracts';
import { useUsdcAllowance } from '@/hooks/useUsdcAllowance';
import { Button } from './Button';
import { UsdcAmount } from './UsdcAmount';

export function ApprovalButton({
  spender,
  amount,
  onApproved,
  children,
}: {
  spender: `0x${string}`;
  amount: bigint;
  onApproved?: () => void;
  /** Rendered when no approval is needed (sufficient allowance, or pre-resolution states). */
  children?: ReactNode;
}) {
  const { address } = useAccount();
  const { allowance, refetch } = useUsdcAllowance(address, spender);

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fire-once gate keyed on `txHash`. The parent may pass a fresh
  // `onApproved` reference each render, which would otherwise re-run
  // this effect even after the approval already completed. Tying the
  // gate to the tx hash means a future approval with a new hash
  // legitimately re-fires; the same hash can only fire once.
  const firedHashRef = useRef<typeof txHash | null>(null);

  useEffect(() => {
    if (!isSuccess || !txHash) return;
    if (firedHashRef.current === txHash) return;
    firedHashRef.current = txHash;
    refetch();
    onApproved?.();
    reset();
  }, [isSuccess, txHash, refetch, onApproved, reset]);

  // We only swap to the Approve CTA when we KNOW the allowance is short.
  // Undefined allowance (loading, no wallet, or amount = 0) → fall through.
  const needsApproval = !!address && amount > 0n && allowance !== undefined && allowance < amount;

  if (!needsApproval) return <>{children}</>;

  const onClick = () =>
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    });

  const busy = isPending || isLoading;

  return (
    <div className="space-y-1">
      <Button variant="primary" size="md" onClick={onClick} disabled={busy} className="w-full">
        {isPending ? (
          'Sign in your wallet…'
        ) : isLoading ? (
          'Approving on-chain…'
        ) : (
          <>
            Approve <UsdcAmount value={amount} precision={2} />
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Approval failed — please try again.
        </p>
      )}
    </div>
  );
}
