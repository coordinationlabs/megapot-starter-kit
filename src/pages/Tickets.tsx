/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 *             https://llms.megapot.io/tasks/read-state
 *             https://llms.megapot.io/tasks/claim-winnings
 *             https://llms.megapot.io/tasks/claim-referral-fees
 *             https://llms.megapot.io/tasks/subscribe
 * @customize  Reads split between live + historical:
 *               - WalletStatsCard, UnclaimedWins, PastRoundTickets → Data API (api.megapot.io)
 *               - CurrentDrawingTickets, ActiveSubscription, ClaimReferralFees → RPC
 *             ClaimReferralFees + ActiveSubscription render conditionally
 *             (no earnings / no subscription = hidden).
 *             PastRoundTickets uses `api.walletTickets` for the outer card
 *             list and `api.round` (lazy, on expansion) for matched-ball
 *             highlighting.
 * ---
 */
import { useAccount } from 'wagmi';
import type { NavKey } from '@/components/layout/Nav';
import { ActiveSubscription } from '@/components/tickets/ActiveSubscription';
import { ClaimReferralFees } from '@/components/tickets/ClaimReferralFees';
import { CurrentDrawingTickets } from '@/components/tickets/CurrentDrawingTickets';
import { PastRoundTickets } from '@/components/tickets/PastRoundTickets';
import { UnclaimedWins } from '@/components/tickets/UnclaimedWins';
import { WalletStatsCard } from '@/components/tickets/WalletStatsCard';
import { COPY } from '@/config/copy';
import { useJackpotState } from '@/hooks/useJackpotState';

export function Tickets({ onNavigate }: { onNavigate: (k: NavKey) => void }) {
  const { address, isConnected } = useAccount();
  const { drawingId } = useJackpotState();

  if (!isConnected || !address) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        {COPY.connectToViewTickets}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WalletStatsCard address={address} />
      <ClaimReferralFees />
      <ActiveSubscription />
      <CurrentDrawingTickets drawingId={drawingId} onNavigate={onNavigate} />
      <UnclaimedWins />
      <PastRoundTickets />
    </div>
  );
}
