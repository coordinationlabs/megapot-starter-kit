/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-withdraw
 * @contract   Jackpot.initiateWithdraw + Jackpot.finalizeWithdraw
 * @customize  Two-step flow: initiate locks shares against the current
 *             drawing, finalize claims the USDC after settlement. Detect
 *             pending state via useLpInfo().userInfo.pendingWithdrawal —
 *             when amountInShares > 0, finalize is gated until
 *             pendingWithdrawal.drawingId < currentDrawingId (i.e. the
 *             locked drawing has settled).
 * ---
 */
import { parseAbi } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { JACKPOT_ADDRESS } from '@/config/contracts';

const abi = parseAbi([
  'function initiateWithdraw(uint256 _amountToWithdrawInShares)',
  'function finalizeWithdraw()',
]);

export function useLpWithdraw() {
  const initiate = useWriteContract();
  const initiateReceipt = useWaitForTransactionReceipt({
    hash: initiate.data,
  });

  const finalize = useWriteContract();
  const finalizeReceipt = useWaitForTransactionReceipt({
    hash: finalize.data,
  });

  const initiateWithdraw = (shares: bigint) => {
    if (shares <= 0n) return;
    initiate.writeContract({
      address: JACKPOT_ADDRESS,
      abi,
      functionName: 'initiateWithdraw',
      args: [shares],
    });
  };

  const finalizeWithdraw = () => {
    finalize.writeContract({
      address: JACKPOT_ADDRESS,
      abi,
      functionName: 'finalizeWithdraw',
    });
  };

  return {
    initiateWithdraw,
    finalizeWithdraw,
    initiate: {
      txHash: initiate.data,
      isWaitingSignature: initiate.isPending,
      isMining: initiateReceipt.isLoading,
      /** Combined "in-flight" flag. */
      isPending: initiate.isPending || initiateReceipt.isLoading,
      isSuccess: initiateReceipt.isSuccess,
      error: initiate.error ?? initiateReceipt.error,
      reset: initiate.reset,
    },
    finalize: {
      txHash: finalize.data,
      isWaitingSignature: finalize.isPending,
      isMining: finalizeReceipt.isLoading,
      /** Combined "in-flight" flag. */
      isPending: finalize.isPending || finalizeReceipt.isLoading,
      isSuccess: finalizeReceipt.isSuccess,
      error: finalize.error ?? finalizeReceipt.error,
      reset: finalize.reset,
    },
  };
}
