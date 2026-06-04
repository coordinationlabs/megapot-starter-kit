/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-bulk
 * @contract   BatchPurchaseFacilitator.createBatchOrder + cancelBatchOrder
 *             + getBatchOrderInfo + event BatchOrderExecuted
 * @customize  Use for 11+ tickets. Approval target = BATCH_PURCHASE_FACILITATOR_ADDRESS.
 *             Subscribes to `BatchOrderExecuted` for instant progress
 *             (per read-state skill's hybrid pattern); falls back to
 *             one-shot read on mount to surface in-flight orders.
 * ---
 */

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { parseAbi } from 'viem';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from 'wagmi';
import {
  BATCH_PURCHASE_FACILITATOR_ADDRESS,
  REFERRAL_SPLIT_FULL,
  REFERRER_ADDRESS,
  TICKET_SOURCE,
} from '@/config/contracts';
import { API_BASE_URL, QK } from '@/lib/api';
import type { CustomTicket } from '@/lib/tickets';

const abi = parseAbi([
  'function createBatchOrder(address _recipient, uint64 _dynamicTicketCount, (uint8[] normals, uint8 bonusball)[] _userStaticTickets, address[] _referrers, uint256[] _referralSplit, bytes32 _source)',
  'function cancelBatchOrder()',
  'function getBatchOrderInfo(address _recipient) view returns ((uint256 orderDrawingId, uint64 remainingUSDC, uint64 remainingTickets, uint64 totalTicketsOrdered, uint64 dynamicTicketCount, address[] referrers, uint256[] referralSplit) batchOrder, (uint8[] normals, uint8 bonusball)[] staticTickets)',
  'event BatchOrderExecuted(address indexed user, uint256 indexed drawingId, uint256[] ticketIds, uint256 ticketsExecuted, uint256 remainingTickets, uint256 remainingUSDC)',
]);

export type BatchProgress = {
  ticketsExecuted: bigint;
  remainingTickets: bigint;
  remainingUSDC: bigint;
};

export function useBulkPurchase() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const create = useWriteContract();
  const createReceipt = useWaitForTransactionReceipt({ hash: create.data });

  const cancel = useWriteContract();
  const cancelReceipt = useWaitForTransactionReceipt({ hash: cancel.data });

  // One-shot read on mount — captures any in-flight order from a prior session.
  const orderInfo = useReadContract({
    address: BATCH_PURCHASE_FACILITATOR_ADDRESS,
    abi,
    functionName: 'getBatchOrderInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Live progress via event (no polling).
  useWatchContractEvent({
    address: BATCH_PURCHASE_FACILITATOR_ADDRESS,
    abi,
    eventName: 'BatchOrderExecuted',
    args: address ? { user: address } : undefined,
    onLogs: (logs) => {
      const last = logs[logs.length - 1];
      if (!last) return;
      const a = last.args as {
        ticketsExecuted?: bigint;
        remainingTickets?: bigint;
        remainingUSDC?: bigint;
      };
      if (
        a.ticketsExecuted !== undefined &&
        a.remainingTickets !== undefined &&
        a.remainingUSDC !== undefined
      ) {
        setProgress({
          ticketsExecuted: a.ticketsExecuted,
          remainingTickets: a.remainingTickets,
          remainingUSDC: a.remainingUSDC,
        });
      }
      orderInfo.refetch();
      // Mirror the post-buy invalidation in Play.tsx so the Tickets page
      // surfaces tickets minted by this batch order as soon as the facilitator
      // settles a chunk — without this the Data API caches lag behind the
      // on-chain state by `staleTime`.
      for (const resource of [
        QK.walletTicketsByRound,
        QK.walletTickets,
        QK.walletStats,
        QK.walletWins,
      ]) {
        queryClient.invalidateQueries({
          queryKey: [QK.NS, API_BASE_URL, resource],
        });
      }
    },
    poll: true,
  });

  const createOrder = (args: { dynamicCount: number; staticTickets: CustomTicket[] }) => {
    if (!address) return;
    // NOTE — the BatchPurchaseFacilitator's `dynamicCount` parameter asks the
    // facilitator to fill `_dynamicCount` random tickets over multiple
    // executor transactions. Unlike `Jackpot.buyTickets`, which has no
    // on-chain randomness (see useBuyTickets), the facilitator generates
    // its own values per fill. Caller passes the raw count; no client-side
    // ticket generation needed here.
    create.writeContract({
      address: BATCH_PURCHASE_FACILITATOR_ADDRESS,
      abi,
      functionName: 'createBatchOrder',
      args: [
        address,
        BigInt(args.dynamicCount),
        args.staticTickets.map((t) => ({ normals: t.normals, bonusball: t.bonusball })),
        [REFERRER_ADDRESS],
        [...REFERRAL_SPLIT_FULL],
        TICKET_SOURCE,
      ],
    });
  };

  /**
   * Cancel an in-flight batch order, refunding the unspent USDC.
   *
   * Exposed for fork-flexibility; **not surfaced in the default UI**.
   * Bulk orders are designed to fill autonomously over multiple
   * keeper-executed txs — most apps should let them run to completion
   * and track progress instead of cancelling mid-fill. Surface this
   * only if your UX explicitly supports mid-fill cancellation.
   */
  const cancelOrder = () => {
    cancel.writeContract({
      address: BATCH_PURCHASE_FACILITATOR_ADDRESS,
      abi,
      functionName: 'cancelBatchOrder',
    });
  };

  return {
    createOrder,
    cancelOrder,
    progress,
    orderInfo: orderInfo.data,
    refetchOrderInfo: orderInfo.refetch,
    create: {
      txHash: create.data,
      isWaitingSignature: create.isPending,
      isMining: createReceipt.isLoading,
      /** Combined "in-flight" flag. */
      isPending: create.isPending || createReceipt.isLoading,
      isSuccess: createReceipt.isSuccess,
      error: create.error ?? createReceipt.error,
      reset: create.reset,
    },
    cancel: {
      txHash: cancel.data,
      isWaitingSignature: cancel.isPending,
      isMining: cancelReceipt.isLoading,
      /** Combined "in-flight" flag. */
      isPending: cancel.isPending || cancelReceipt.isLoading,
      isSuccess: cancelReceipt.isSuccess,
      error: cancel.error ?? cancelReceipt.error,
      reset: cancel.reset,
    },
  };
}
