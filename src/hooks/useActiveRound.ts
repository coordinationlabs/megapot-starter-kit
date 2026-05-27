/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @endpoint   GET /v1/rounds/active
 * @customize  Aggregate stats for the LIVE round — `ticket_count`,
 *             `unique_participants`, `prize_pool`, etc. Use this when you
 *             need API-derived aggregates (participants, indexer-computed
 *             totals); use `useJackpotState` for sub-block chain state
 *             (lifecycle phase, drawing time, ball bounds).
 *
 *             Active rounds change as tickets sell, so `staleTime` is short
 *             (30s) and the query refetches on focus. Settled rounds — once
 *             the active one rolls over — are immutable; use `useRound` for
 *             those (`staleTime: Infinity`).
 * ---
 */
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, api, apiQueryRetry, QK } from '@/lib/api';

const THIRTY_SECONDS = 30 * 1000;

export function useActiveRound() {
  return useQuery({
    queryKey: [QK.NS, API_BASE_URL, QK.round, 'active'],
    queryFn: ({ signal }) => api.activeRound({ signal }),
    staleTime: THIRTY_SECONDS,
    refetchInterval: THIRTY_SECONDS,
    ...apiQueryRetry,
  });
}
