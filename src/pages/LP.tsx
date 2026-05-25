/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-deposit
 *             https://llms.megapot.io/tasks/lp-withdraw
 * @customize  PoolStatus is always visible (even when disconnected) so a
 *             casual visitor sees pool capacity. Deposit + Withdraw render
 *             when connected.
 * ---
 */
import { useAccount } from 'wagmi';
import { DepositForm } from '@/components/lp/DepositForm';
import { PoolStatus } from '@/components/lp/PoolStatus';
import { WithdrawTwoStep } from '@/components/lp/WithdrawTwoStep';
import { COPY } from '@/config/copy';
import { useJackpotState } from '@/hooks/useJackpotState';
import { useLpInfo } from '@/hooks/useLpInfo';

export function LP() {
  const { address, isConnected } = useAccount();
  const { state, drawingId } = useJackpotState();

  const lp = useLpInfo({ drawingId, user: address });

  return (
    <div className="space-y-4">
      <PoolStatus
        poolCap={lp.poolCap}
        poolTotal={lp.drawingState?.lpPoolTotal}
        pendingDeposits={lp.drawingState?.pendingDeposits}
        remainingCapacity={lp.remainingCapacity}
        isClosed={lp.isClosed}
      />

      {!isConnected && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {COPY.connectToProvideLiquidity}
        </div>
      )}

      {isConnected && (
        <div className="grid gap-4 md:grid-cols-2">
          <DepositForm
            remainingCapacity={lp.remainingCapacity}
            isClosed={lp.isClosed}
            onSuccess={lp.refetch}
          />
          <WithdrawTwoStep
            userInfo={lp.userInfo}
            currentDrawingId={drawingId}
            drawingTime={state?.drawingTime}
            onSuccess={lp.refetch}
          />
        </div>
      )}
    </div>
  );
}
