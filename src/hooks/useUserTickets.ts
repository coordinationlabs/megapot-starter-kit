/**
 * ---
 * @skill      https://llms.megapot.io/data-api § "When to Use This vs. RPC"
 * @endpoint   GET /v1/wallets/{address}/tickets/rounds/{roundId}
 * @customize  The wallet's tickets for one drawing — current OR past — via
 *             the Data API. Match-side fields (`matched_normals`,
 *             `bonusball_match`, `winnings_amount`) are null on the active
 *             round by design.
 *
 *             The Data API is the default for both current + past drawing
 *             reads — RPC is reserved for live drawing state. Sub-block "I
 *             just bought, where's my ticket?" feedback is handled by
 *             invalidating this query from `Play.tsx` on a successful buy.
 *             For tighter latency, swap to RPC `getUserTickets` + a
 *             `TicketPurchased` event subscription.
 * ---
 */
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, api, apiQueryRetry, QK, type Ticket } from '@/lib/api';

const ONE_MINUTE = 60 * 1000;

export function useUserTickets(user: `0x${string}` | undefined, drawingId: bigint | undefined) {
  const query = useQuery({
    queryKey: [QK.NS, API_BASE_URL, QK.walletTicketsByRound, user, drawingId?.toString()],
    queryFn: ({ signal }) =>
      // biome-ignore lint/style/noNonNullAssertion: guarded by `enabled: !!user && drawingId !== undefined` below
      api.walletTicketsForRound(user!, drawingId!.toString(), {
        limit: 100,
        signal,
      }),
    enabled: !!user && drawingId !== undefined,
    // Per the react-setup SKILL "staleTime" table — wallet ticket lists
    // churn only on buys; explicit invalidation in Play.tsx covers the
    // post-buy refresh, so the freshness budget here can be wide.
    staleTime: ONE_MINUTE,
    ...apiQueryRetry,
  });

  return {
    tickets: (query.data?.data ?? []) as readonly Ticket[],
    isLoading: query.isLoading,
    error: query.error,
  };
}
