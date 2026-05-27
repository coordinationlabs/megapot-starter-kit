/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @endpoint   GET /v1/wallets/{address}/stats
 * @customize  Lifetime aggregate for one wallet — total tickets, total wins,
 *             total winnings, total spent, total referral earnings, rounds
 *             played, first/last seen. Replaces an RPC `getUserTickets` loop
 *             across every drawing.
 *
 *             `staleTime` = 60s per the react-setup SKILL guidance — wallet
 *             aggregates only change when the wallet acts.
 * ---
 */
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, api, apiQueryRetry, QK, type WalletStats } from '@/lib/api';

const ONE_MINUTE = 60 * 1000;

export function useWalletStats(address: `0x${string}` | undefined) {
  const query = useQuery<WalletStats>({
    queryKey: [QK.NS, API_BASE_URL, QK.walletStats, address],
    // biome-ignore lint/style/noNonNullAssertion: guarded by `enabled: !!address` below
    queryFn: ({ signal }) => api.walletStats(address!, { signal }),
    enabled: !!address,
    staleTime: ONE_MINUTE,
    ...apiQueryRetry,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
