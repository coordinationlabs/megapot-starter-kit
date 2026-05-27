/**
 * ---
 * @skill      https://llms.megapot.io/data-api § Recipe 4
 * @endpoint   GET /v1/rounds
 * @customize  Paginated round history with per-round aggregates folded in
 *             (ticket count, unique participants, winners count, top prize,
 *             winning numbers, prize tiers). Cursor-paginated via TanStack
 *             Query's `useInfiniteQuery`.
 *
 *             `staleTime` = 5 min per the react-setup SKILL guidance —
 *             round listings only churn when a drawing settles. We also
 *             subscribe to `JackpotSettled` and invalidate immediately so
 *             the History page reflects a fresh settlement without waiting
 *             for staleTime to expire.
 * ---
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parseAbi } from 'viem';
import { useWatchContractEvent } from 'wagmi';
import { JACKPOT_ADDRESS } from '@/config/contracts';
import { API_BASE_URL, api, apiQueryRetry, QK, type Round } from '@/lib/api';

const FIVE_MINUTES = 5 * 60 * 1000;

const settledAbi = parseAbi([
  'event JackpotSettled(uint256 indexed drawingId, uint256 lpEarnings, uint256 userWinnings, uint8 winningBonusball, uint256 winningNumbers, uint256 newDrawingAccumulator)',
]);

export function useRoundsList(opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? 20;
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: [QK.NS, API_BASE_URL, QK.rounds, pageSize],
    queryFn: ({ pageParam, signal }) =>
      api.listRounds({ limit: pageSize, cursor: pageParam, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? (last.next_cursor ?? undefined) : undefined),
    staleTime: FIVE_MINUTES,
    ...apiQueryRetry,
  });

  useWatchContractEvent({
    address: JACKPOT_ADDRESS,
    abi: settledAbi,
    eventName: 'JackpotSettled',
    onLogs: () => {
      queryClient.invalidateQueries({
        queryKey: [QK.NS, API_BASE_URL, QK.rounds],
      });
    },
    poll: true,
  });

  const rounds: readonly Round[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  return {
    rounds,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
