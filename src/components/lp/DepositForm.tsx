/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-deposit
 * @customize  Deposit form with capacity check + max button. Approval target
 *             = JACKPOT_ADDRESS (lpDeposit lives on Jackpot). Max button
 *             rounds the user's USDC balance down to the nearest dollar so
 *             it doesn't exceed available capacity.
 * ---
 */
import { useEffect, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount } from 'wagmi';
import { ApprovalButton } from '@/components/common/ApprovalButton';
import { Button } from '@/components/common/Button';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { JACKPOT_ADDRESS, USDC_DECIMALS } from '@/config/contracts';
import { useConfirmedFlash } from '@/hooks/useConfirmedFlash';
import { useLpDeposit } from '@/hooks/useLpDeposit';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';

export function DepositForm({
  remainingCapacity,
  isClosed,
  onSuccess,
}: {
  remainingCapacity: bigint | undefined;
  isClosed: boolean | undefined;
  onSuccess?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { balance } = useUsdcBalance(address);
  const deposit = useLpDeposit();
  const [text, setText] = useState('');
  const flashing = useConfirmedFlash(deposit.isSuccess, deposit.reset);

  // Clear the amount field + bump parent (LP page refetches its info) on
  // success. Reset of the write hook is handled by `useConfirmedFlash` so
  // the "✓ Deposited!" pulse stays visible.
  useEffect(() => {
    if (deposit.isSuccess) {
      setText('');
      onSuccess?.();
    }
  }, [deposit.isSuccess, onSuccess]);

  const amount = useMemo(() => {
    if (!text) return undefined;
    try {
      const parsed = parseUnits(text, USDC_DECIMALS);
      return parsed > 0n ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [text]);

  // Round USDC balance down to nearest dollar for the Max button.
  const maxRounded = useMemo(() => {
    if (balance === undefined) return undefined;
    const oneUsdc = 10n ** BigInt(USDC_DECIMALS);
    return (balance / oneUsdc) * oneUsdc;
  }, [balance]);

  const cap = remainingCapacity;
  const tooBig = amount !== undefined && cap !== undefined && amount > cap;
  const overBalance = amount !== undefined && balance !== undefined && amount > balance;

  const submitDisabled =
    !isConnected || !amount || tooBig || overBalance || !!isClosed || deposit.isPending;

  const setMax = () => {
    if (maxRounded === undefined || cap === undefined) return;
    const useMax = maxRounded < cap ? maxRounded : cap;
    if (useMax > 0n) {
      // Format back to USDC string (no decimals shown for whole-dollar Max)
      const whole = useMax / 10n ** BigInt(USDC_DECIMALS);
      setText(whole.toString());
    }
  };

  return (
    <section className="card-pad space-y-3">
      <h2 className="text-sm font-semibold">Deposit liquidity</h2>

      {isClosed && (
        <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          Pool is at capacity. Deposits paused.
        </p>
      )}

      <div className="space-y-1">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            disabled={!isConnected || isClosed}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={setMax}
            disabled={!isConnected || isClosed || balance === undefined || balance === 0n}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Max
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Wallet: <UsdcAmount value={balance} precision={2} /> · Deposit up to{' '}
          <UsdcAmount value={cap} precision={2} compact />
        </p>
        {tooBig && (
          <p className="text-xs text-rose-600">
            Exceeds remaining capacity (<UsdcAmount value={cap} precision={2} />
            ).
          </p>
        )}
        {overBalance && <p className="text-xs text-rose-600">Exceeds wallet balance.</p>}
      </div>

      <ApprovalButton
        spender={JACKPOT_ADDRESS}
        amount={!isClosed && !tooBig && !overBalance ? (amount ?? 0n) : 0n}
      >
        <Button
          variant="primary"
          size="md"
          onClick={() => amount && deposit.deposit(amount)}
          disabled={submitDisabled || flashing}
          className="w-full"
        >
          {deposit.isWaitingSignature
            ? 'Sign in your wallet…'
            : deposit.isMining
              ? 'Confirming on-chain…'
              : flashing
                ? '✓ Deposited!'
                : 'Deposit'}
        </Button>
      </ApprovalButton>

      <TxStatus
        hash={deposit.txHash}
        isPending={deposit.isPending}
        isSuccess={deposit.isSuccess}
        error={deposit.error}
      />
    </section>
  );
}
