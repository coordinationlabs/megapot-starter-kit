/**
 * ---
 * @skill      https://llms.megapot.io/tasks/lp-deposit
 * @contract   JackpotLPManager.lpPoolCap + getLPDrawingState + getLpInfo
 * @customize  Three separate `useReadContract` calls — auto-batched by the
 *             multicall-enabled http transport (see config/wagmi.ts). Cleaner
 *             than juggling a heterogeneous `useReadContracts` array.
 * ---
 */
import { parseAbi } from 'viem';
import { useReadContract } from 'wagmi';
import { JACKPOT_LP_MANAGER_ADDRESS } from '@/config/contracts';

const abi = parseAbi([
  'function lpPoolCap() view returns (uint256)',
  'function getLPDrawingState(uint256 _drawingId) view returns ((uint256 lpPoolTotal, uint256 pendingDeposits, uint256 pendingWithdrawals))',
  'function getLpInfo(address _lpAddress) view returns ((uint256 consolidatedShares, (uint256 amount, uint256 drawingId) lastDeposit, (uint256 amountInShares, uint256 drawingId) pendingWithdrawal, uint256 claimableWithdrawals))',
]);

export type LPDrawingState = {
  lpPoolTotal: bigint;
  pendingDeposits: bigint;
  pendingWithdrawals: bigint;
};

export type LpInfo = {
  consolidatedShares: bigint;
  /** `lastDeposit.amount` is in USDC (deposit amount), not shares — `pendingWithdrawal.amountInShares` is in shares. */
  lastDeposit: { amount: bigint; drawingId: bigint };
  pendingWithdrawal: { amountInShares: bigint; drawingId: bigint };
  claimableWithdrawals: bigint;
};

export function useLpInfo(args: { drawingId: bigint | undefined; user?: `0x${string}` }) {
  const poolCapQuery = useReadContract({
    address: JACKPOT_LP_MANAGER_ADDRESS,
    abi,
    functionName: 'lpPoolCap',
  });

  const drawingStateQuery = useReadContract({
    address: JACKPOT_LP_MANAGER_ADDRESS,
    abi,
    functionName: 'getLPDrawingState',
    args: args.drawingId !== undefined ? [args.drawingId] : undefined,
    query: { enabled: args.drawingId !== undefined },
  });

  const userInfoQuery = useReadContract({
    address: JACKPOT_LP_MANAGER_ADDRESS,
    abi,
    functionName: 'getLpInfo',
    args: args.user ? [args.user] : undefined,
    query: { enabled: !!args.user },
  });

  const poolCap = poolCapQuery.data;
  const drawingState = drawingStateQuery.data as LPDrawingState | undefined;
  const userInfo = userInfoQuery.data as LpInfo | undefined;

  // Cap constrains the *effective* pool size, which at the next drawing
  // will be `lpPoolTotal + pendingDeposits`. Earlier revisions compared only
  // `pendingDeposits` to `lpPoolCap`, which under-reported usage by the size
  // of the active pool — a full pool showed as ~empty.
  const effectiveTotal =
    drawingState !== undefined
      ? drawingState.lpPoolTotal + drawingState.pendingDeposits
      : undefined;

  const isClosed =
    poolCap !== undefined && effectiveTotal !== undefined ? effectiveTotal >= poolCap : undefined;

  const remainingCapacity =
    poolCap !== undefined && effectiveTotal !== undefined
      ? effectiveTotal >= poolCap
        ? 0n
        : poolCap - effectiveTotal
      : undefined;

  return {
    poolCap,
    drawingState,
    userInfo,
    isClosed,
    remainingCapacity,
    isLoading:
      poolCapQuery.isLoading ||
      drawingStateQuery.isLoading ||
      (!!args.user && userInfoQuery.isLoading),
    refetch: () => {
      poolCapQuery.refetch();
      drawingStateQuery.refetch();
      if (args.user) userInfoQuery.refetch();
    },
  };
}
