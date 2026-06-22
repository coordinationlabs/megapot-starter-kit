/**
 * ---
 * @skill      https://llms.megapot.io/tasks/subscribe
 * @contract   JackpotAutoSubscription.createSubscription + cancelSubscription
 *             + getSubscriptionInfo
 * @customize  One active subscription per address. Approval target =
 *             JACKPOT_AUTO_SUBSCRIPTION_ADDRESS. `getSubscriptionInfo`
 *             reverts with `NoActiveSubscription()` when none exists —
 *             we treat the revert as "no active subscription" via
 *             react-query's error state.
 * ---
 */
import { parseAbi } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import {
  JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
  REFERRAL_SPLIT_FULL,
  REFERRER_ADDRESS,
  TICKET_SOURCE,
} from '@/config/contracts';
import type { CustomTicket } from '@/lib/tickets';

const abi = parseAbi([
  'function createSubscription(address _recipient, uint64 _totalDays, uint64 _dynamicTicketCount, (uint8[] normals, uint8 bonusball)[] _userStaticTickets, address[] _referrers, uint256[] _referralSplit, bytes32 _source)',
  'function cancelSubscription()',
  'function getSubscriptionInfo(address _recipient) view returns ((uint64 remainingUSDC, uint64 lastExecutedDrawing, uint64 subscribedTicketPrice, uint64 dynamicTicketCount, address[] referrers, uint256[] referralSplit) subscription, (uint8[] normals, uint8 bonusball)[] staticTickets)',
]);

export type SubscriptionInfo = {
  subscription: {
    remainingUSDC: bigint;
    lastExecutedDrawing: bigint;
    subscribedTicketPrice: bigint;
    dynamicTicketCount: bigint;
    referrers: readonly `0x${string}`[];
    referralSplit: readonly bigint[];
  };
  staticTickets: readonly { normals: readonly number[]; bonusball: number }[];
};

export function useSubscribe() {
  const { address } = useAccount();

  const create = useWriteContract();
  const createReceipt = useWaitForTransactionReceipt({ hash: create.data });

  const cancel = useWriteContract();
  const cancelReceipt = useWaitForTransactionReceipt({ hash: cancel.data });

  // Reads getSubscriptionInfo. Reverts with NoActiveSubscription() when none —
  // surfaces as a query error; consumers can treat error as "no active sub".
  const info = useReadContract({
    address: JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
    abi,
    functionName: 'getSubscriptionInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, retry: false },
  });

  const hasActiveSubscription = info.isSuccess && !!info.data;

  const createSubscription = (args: {
    totalDays: number;
    dynamicCount: number;
    staticTickets: CustomTicket[];
  }) => {
    if (!address) return;
    create.writeContract({
      address: JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
      abi,
      functionName: 'createSubscription',
      args: [
        address,
        BigInt(args.totalDays),
        BigInt(args.dynamicCount),
        args.staticTickets.map((t) => ({ normals: t.normals, bonusball: t.bonusball })),
        [REFERRER_ADDRESS],
        [...REFERRAL_SPLIT_FULL],
        TICKET_SOURCE,
      ],
    });
  };

  const cancelSubscription = () => {
    cancel.writeContract({
      address: JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
      abi,
      functionName: 'cancelSubscription',
    });
  };

  return {
    createSubscription,
    cancelSubscription,
    info: info.data as SubscriptionInfo | undefined,
    hasActiveSubscription,
    refetchInfo: info.refetch,
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
