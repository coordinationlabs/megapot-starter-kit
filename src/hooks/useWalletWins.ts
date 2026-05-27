/**
 * ---
 * @skill      https://llms.megapot.io/data-api § Recipe 4
 * @endpoint   GET /v1/wallets/{address}/wins
 * @customize  Cross-drawing wallet wins with claim status. Cursor-paginated
 *             via TanStack Query's `useInfiniteQuery` per the react-setup
 *             skill — `fetchNextPage` powers a "Load more" button without a
 *             custom state machine.
 *
 *             Sort: the API returns wins ordered by `winnings_amount DESC,
 *             id DESC` — biggest-prize-first across all rounds. We group by
 *             `round_id` for display and re-sort wins within each round by
 *             `id` desc so display order is stable across renders.
 *
 *             Retry: API errors with `code` of `rate_limited` /
 *             `upstream_unavailable` retry up to 3 times with `Retry-After`
 *             honored — see `apiQueryRetry`.
 * ---
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { API_BASE_URL, api, apiQueryRetry, QK, type Win } from '@/lib/api';

const ONE_MINUTE = 60 * 1000;

export type WinsByRound = {
  /** Stringified round id so React keys / map lookups stay primitive. */
  roundId: string;
  wins: Win[];
  totalAmount: bigint;
};

/**
 * Cross-drawing wallet wins, optionally filtered by claim status.
 *
 * `claimed` modes (API v1.6.0):
 * - `undefined` (default) — every win, claimed + unclaimed. Use for a
 *   lifetime "all wins ever" history surface.
 * - `true` — only claimed wins. Use for a "history of payouts" feed.
 * - `false` — only unclaimed wins. Use for a "wins to claim" surface
 *   (this is what the kit's `<UnclaimedWins>` passes).
 *
 * The query key includes `claimed` so the three modes never share cache
 * entries; switching modes triggers a fresh fetch.
 */
export function useWalletWins(
  address: `0x${string}` | undefined,
  opts: { pageSize?: number; claimed?: boolean } = {},
) {
  const pageSize = opts.pageSize ?? 50;
  const claimed = opts.claimed;
  const query = useInfiniteQuery({
    queryKey: [QK.NS, API_BASE_URL, QK.walletWins, address, pageSize, claimed],
    queryFn: ({ pageParam, signal }) =>
      // biome-ignore lint/style/noNonNullAssertion: guarded by `enabled: !!address` below
      api.walletWins(address!, {
        limit: pageSize,
        cursor: pageParam,
        claimed,
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? (last.next_cursor ?? undefined) : undefined),
    enabled: !!address,
    staleTime: ONE_MINUTE,
    ...apiQueryRetry,
  });

  /** Flat win list across every fetched page. */
  const wins: Win[] = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  const grouped: WinsByRound[] = useMemo(() => {
    const byRound = new Map<string, Win[]>();
    for (const w of wins) {
      const list = byRound.get(w.round_id) ?? [];
      list.push(w);
      byRound.set(w.round_id, list);
    }
    return Array.from(byRound.entries())
      .sort(([a], [b]) => {
        const ai = BigInt(a);
        const bi = BigInt(b);
        return ai > bi ? -1 : ai < bi ? 1 : 0;
      })
      .map(([roundId, ws]) => {
        const sorted = [...ws].sort((a, b) => {
          const ai = BigInt(a.id);
          const bi = BigInt(b.id);
          return bi > ai ? 1 : bi < ai ? -1 : 0;
        });
        return {
          roundId,
          wins: sorted,
          totalAmount: sorted.reduce((s, w) => s + BigInt(w.amount.amount), 0n),
        };
      });
  }, [wins]);

  return {
    wins,
    grouped,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
