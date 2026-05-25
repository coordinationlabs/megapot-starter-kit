/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @customize  Card grid of past rounds, fully API-driven. Each `Round` arrives
 *             with per-round aggregates (`ticket_count`, `unique_participants`,
 *             `winners_count`, `top_prize_amount`) plus winning numbers and
 *             prize-tier payouts when settled — one paginated call covers
 *             everything the page renders, including the disclosure body.
 * ---
 */
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { Ball } from '@/components/lottery/Ball';
import { PrizeTiers, type TierRow } from '@/components/lottery/PrizeTiers';
import type { Round } from '@/lib/api';
import { amountToBigInt } from '@/lib/api';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function DrawingList({ rounds }: { rounds: readonly Round[] }) {
  if (rounds.length === 0) {
    return <p className="card-pad-lg text-center text-sm text-zinc-500">No past drawings yet.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rounds.map((r) => (
        <DrawingCard key={r.id} round={r} />
      ))}
    </div>
  );
}

function DrawingCard({ round }: { round: Round }) {
  const isSettled = round.status === 'settled';
  const prizePool = amountToBigInt(round.prize_pool);
  const topPrize = amountToBigInt(round.top_prize_amount);
  // `lp_earnings` is non-null on every round per OpenAPI v1.5.0 — `0` while
  // open, finalized at settlement. We only render History on settled rounds,
  // so this is always a meaningful payout figure.
  const lpEarnings = BigInt(round.lp_earnings.amount);
  const winning = round.winning_numbers;
  const tiers: TierRow[] | undefined = round.prize_tiers?.map((t) => ({
    tierId: t.tier_id,
    payout: BigInt(t.payout.amount),
    ticketCount: t.ticket_count,
  }));

  return (
    <article className="card-pad space-y-3">
      <header className="flex items-baseline justify-between">
        <span className="font-mono text-xs text-zinc-500">#{round.id}</span>
        <span className="text-xs text-zinc-500">{fmtDate(round.settled_at ?? round.ended_at)}</span>
      </header>

      <p className="text-center">
        <span className="block text-[11px] uppercase tracking-wide text-zinc-500">Prize pool</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">
          <UsdcAmount value={prizePool} precision={0} />
        </span>
      </p>

      {winning && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {winning.normals.map((n, i) => (
            <Ball
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-position winning ball
              key={i}
              n={n}
              selected
            />
          ))}
          <span className="px-0.5 text-zinc-400">·</span>
          <Ball n={winning.bonusball} variant="bonus" selected />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-zinc-500">Tickets sold</dt>
          <dd className="font-mono tabular-nums">{round.ticket_count.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Players</dt>
          <dd className="font-mono tabular-nums">{round.unique_participants.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Winners</dt>
          <dd className="font-mono tabular-nums">{round.winners_count.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Top prize</dt>
          <dd className="font-mono tabular-nums">
            {topPrize !== undefined ? (
              <UsdcAmount value={topPrize} precision={0} compact />
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </dd>
        </div>
      </dl>

      {isSettled && (
        <p className="border-t border-zinc-100 pt-2 text-center text-xs text-zinc-500 dark:border-zinc-800">
          LP earned{' '}
          <span className="font-mono font-medium text-zinc-700 tabular-nums dark:text-zinc-300">
            <UsdcAmount value={lpEarnings} precision={2} />
          </span>
        </p>
      )}

      {!isSettled && (
        <p className="text-center text-xs text-amber-700 dark:text-amber-300">Pending settlement</p>
      )}

      {isSettled && tiers && (
        <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer select-none px-2 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
            Prize tier breakdown
          </summary>
          <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
            <PrizeTiers tiers={tiers} flat />
          </div>
        </details>
      )}
    </article>
  );
}
