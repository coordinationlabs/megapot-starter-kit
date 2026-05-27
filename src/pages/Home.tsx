/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Composes the read-side hooks and lottery display components.
 *             Layout is a single column on mobile, 2-col with sidebar tier
 *             table on `md+`. Everything is wallet-optional — no
 *             `useAccount` here.
 *
 *             The desktop "Play now" CTA is `md+` only because the mobile
 *             bottom-nav surfaces the Play tab natively — adding a
 *             redundant in-page button on mobile would just duplicate the
 *             tab bar.
 * ---
 */
import { Button } from '@/components/common/Button';
import type { NavKey } from '@/components/layout/Nav';
import { Countdown } from '@/components/lottery/Countdown';
import { LifecycleStatus } from '@/components/lottery/LifecycleStatus';
import { PrizePool } from '@/components/lottery/PrizePool';
import { PrizeTiers } from '@/components/lottery/PrizeTiers';
import { useActiveRound } from '@/hooks/useActiveRound';
import { useJackpotState } from '@/hooks/useJackpotState';
import { usePrizeTiers } from '@/hooks/usePrizeTiers';

export function Home({ onNavigate }: { onNavigate: (k: NavKey) => void }) {
  const { phase, state, drawingId } = useJackpotState();
  const activeRound = useActiveRound();
  const { tiers } = usePrizeTiers({
    drawingId,
    prizePool: state?.prizePool,
    ballMax: state?.ballMax,
    bonusballMax: state?.bonusballMax,
    referralWinShare: state?.referralWinShare,
  });

  const playDisabled = phase !== 'open';

  // `referralWinShare` is 1e18-scale on chain. Convert to a human percent for
  // the footnote — small loss of precision via Number() is fine for a label.
  const referralPct =
    state?.referralWinShare !== undefined
      ? (Number(state.referralWinShare) / 1e18) * 100
      : undefined;
  const tiersFootnote =
    referralPct !== undefined ? (
      <>
        Net of the <span className="font-medium">{referralPct.toFixed(1)}%</span> referral fee paid
        to the referring app — what a winner actually receives. Gross contract values are higher by
        this share; see{' '}
        <a
          href="https://llms.megapot.io/tasks/claim-referral-fees"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          claim-referral-fees
        </a>{' '}
        for the formula.
      </>
    ) : null;

  // Tickets sold comes from chain (real-time, no indexer lag); players come
  // from the API (indexer-computed, refreshed every 30s).
  const ticketsSold = state?.globalTicketsBought;
  const uniquePlayers = activeRound.data?.unique_participants;

  return (
    <div className="space-y-4">
      <LifecycleStatus phase={phase} drawingId={drawingId} />

      <section className="grid grid-cols-2 gap-2 sm:gap-3" aria-label="This round stats">
        <Stat label="Tickets sold" value={ticketsSold?.toLocaleString()} />
        <Stat label="Players" value={uniquePlayers?.toLocaleString()} />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <PrizePool value={state?.prizePool} />
          <section className="card-pad-lg text-center">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Drawing closes in</p>
            <div className="mt-2">
              <Countdown drawingTimeUnix={state?.drawingTime} />
            </div>
          </section>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('play')}
            disabled={playDisabled}
            className="hidden w-full md:block"
          >
            {playDisabled ? 'Tickets paused' : 'Play now →'}
          </Button>
        </div>
        <div>
          <PrizeTiers tiers={tiers} footnote={tiersFootnote} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card-pad text-center">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 sm:text-xs">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums sm:text-xl">
        {value ?? <span className="text-zinc-400">—</span>}
      </p>
    </div>
  );
}
