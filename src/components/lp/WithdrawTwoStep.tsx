/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-withdraw
 * @customize  Two-step flow:
 *               1. initiateWithdraw(shares) — locks shares against the
 *                  current drawing
 *               2. finalizeWithdraw() — claims USDC after that drawing
 *                  settles
 *             Pending state surfaces via useLpInfo's `userInfo.pendingWithdrawal`.
 *             Finalize is gated until pendingWithdrawal.drawingId < currentDrawingId.
 * ---
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { useConfirmedFlash } from '@/hooks/useConfirmedFlash';
import { useJackpotState } from '@/hooks/useJackpotState';
import type { LpInfo } from '@/hooks/useLpInfo';
import { useLpWithdraw } from '@/hooks/useLpWithdraw';

export function WithdrawTwoStep({
  userInfo,
  currentDrawingId,
  drawingTime,
  onSuccess,
}: {
  userInfo: LpInfo | undefined;
  currentDrawingId: bigint | undefined;
  drawingTime: bigint | undefined;
  onSuccess?: () => void;
}) {
  const { initiateWithdraw, finalizeWithdraw, initiate, finalize } = useLpWithdraw();
  // `useJackpotState` dedupes via TanStack query keys, so calling here in
  // addition to <LP> doesn't cost a second RPC subscription — it gives us
  // access to `refetch` so we can advance `currentDrawingId` on the
  // initiate-confirmed transition without waiting for the 30s open-phase
  // poll. Without this the `pendingDrawingId < currentDrawingId`
  // finalize-gate stays "not ready" for up to a full polling window
  // after `NewDrawingInitialized` fires.
  const { refetch: refetchDrawingState } = useJackpotState();

  const [sharesPct, setSharesPct] = useState(100);

  const initiateFlash = useConfirmedFlash(initiate.isSuccess, initiate.reset);
  const finalizeFlash = useConfirmedFlash(finalize.isSuccess, finalize.reset);

  // Refetch on success; the reset() that previously fired here is now owned
  // by `useConfirmedFlash` so the "✓ Initiated/Withdrawn!" pulse stays visible
  // for ~2s before the UI swaps to the next phase.
  useEffect(() => {
    if (initiate.isSuccess || finalize.isSuccess) {
      onSuccess?.();
      refetchDrawingState();
    }
  }, [initiate.isSuccess, finalize.isSuccess, onSuccess, refetchDrawingState]);

  const totalShares = userInfo?.consolidatedShares ?? 0n;
  const sharesToWithdraw = useMemo(
    () => (totalShares * BigInt(sharesPct)) / 100n,
    [totalShares, sharesPct],
  );

  const pendingShares = userInfo?.pendingWithdrawal.amountInShares ?? 0n;
  const pendingDrawingId = userInfo?.pendingWithdrawal.drawingId;
  const hasPending = pendingShares > 0n;

  const finalizeReady =
    hasPending &&
    pendingDrawingId !== undefined &&
    currentDrawingId !== undefined &&
    pendingDrawingId < currentDrawingId;

  // Time remaining until the pending withdrawal can be finalized — uses the
  // current drawing's drawingTime as a coarse estimate.
  const remaining =
    hasPending && drawingTime !== undefined
      ? Math.max(0, Number(drawingTime) - Math.floor(Date.now() / 1000))
      : null;
  const remainingLabel =
    remaining !== null
      ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`
      : null;

  return (
    <section className="card-pad space-y-3">
      <h2 className="text-sm font-semibold">Withdraw liquidity</h2>

      {hasPending ? (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
            Pending withdrawal
          </p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-amber-700 dark:text-amber-300">Shares locked</dt>
              <dd className="font-mono">{pendingShares.toString()}</dd>
            </div>
            <div>
              <dt className="text-amber-700 dark:text-amber-300">
                {finalizeReady ? 'Status' : 'Available after'}
              </dt>
              <dd className="font-mono">
                {finalizeReady ? 'Ready to finalize' : `~${remainingLabel ?? '—'}`}
              </dd>
            </div>
          </dl>
          <Button
            variant="primary"
            size="sm"
            onClick={finalizeWithdraw}
            disabled={!finalizeReady || finalize.isPending || finalizeFlash}
            className="w-full"
          >
            {finalize.isWaitingSignature
              ? 'Sign in your wallet…'
              : finalize.isMining
                ? 'Confirming on-chain…'
                : finalizeFlash
                  ? '✓ Withdrawn!'
                  : 'Finalize withdrawal'}
          </Button>
          <TxStatus
            hash={finalize.txHash}
            isPending={finalize.isPending}
            isSuccess={finalize.isSuccess}
            error={finalize.error}
          />
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-baseline justify-between">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: decorative section heading; the <input type="range"> below is self-labeled */}
              <label className="text-xs uppercase tracking-wide text-zinc-500">Withdraw</label>
              <span className="text-lg font-semibold tabular-nums">{sharesPct}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={sharesPct}
              onChange={(e) => setSharesPct(Number(e.target.value))}
              disabled={totalShares === 0n}
              className="w-full mt-1"
            />
            <p className="text-xs text-zinc-500">
              {sharesToWithdraw.toString()} of {totalShares.toString()} shares
              {userInfo?.claimableWithdrawals ? (
                <>
                  {' '}
                  · Claimable balance:{' '}
                  <UsdcAmount value={userInfo.claimableWithdrawals} precision={2} />
                </>
              ) : null}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => initiateWithdraw(sharesToWithdraw)}
            disabled={
              totalShares === 0n || sharesToWithdraw === 0n || initiate.isPending || initiateFlash
            }
            className="w-full"
          >
            {initiate.isWaitingSignature
              ? 'Sign in your wallet…'
              : initiate.isMining
                ? 'Confirming on-chain…'
                : initiateFlash
                  ? '✓ Initiated'
                  : 'Initiate withdrawal'}
          </Button>
          <TxStatus
            hash={initiate.txHash}
            isPending={initiate.isPending}
            isSuccess={initiate.isSuccess}
            error={initiate.error}
          />
          <p className="text-xs text-zinc-500">
            Step 1 of 2: locks shares against the current drawing. After it settles, return here to
            finalize and receive USDC.
          </p>
        </>
      )}
    </section>
  );
}
