/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @endpoint   GET /v1/rounds/{roundId}
 * @customize  Single-round detail fetch. Settled rounds are immutable, so
 *             `staleTime` is infinite — once resolved, cache hits forever.
 *
 *             Used by `UnclaimedWins` per-round-group and `PastRoundTickets`
 *             per-expansion to fetch `winning_numbers` for matched-ball
 *             highlighting on past-drawing `TicketCard`s. The lazy/cached
 *             shape means a user expanding multiple round cards only pays
 *             the network cost once per round.
 *
 *             Retry: API errors with `code` of `rate_limited` /
 *             `upstream_unavailable` retry up to 3 times with `Retry-After`
 *             honored — see `apiQueryRetry`.
 * ---
 */
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, api, apiQueryRetry, QK } from '@/lib/api';

export function useRound(roundId: string | undefined) {
  return useQuery({
    queryKey: [QK.NS, API_BASE_URL, QK.round, roundId],
    // biome-ignore lint/style/noNonNullAssertion: guarded by `enabled: !!roundId` below
    queryFn: ({ signal }) => api.round(roundId!, { signal }),
    enabled: !!roundId,
    // Settled rounds are immutable — never refetch unless explicitly invalidated.
    staleTime: Number.POSITIVE_INFINITY,
    ...apiQueryRetry,
  });
}
