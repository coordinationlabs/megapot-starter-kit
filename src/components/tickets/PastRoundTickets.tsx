/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @customize  Per-round historical ticket view. One card per past round
 *             the user has tickets in, with a summary row that expands
 *             on click to show every ticket in that round (matched balls
 *             highlighted via `<TicketCard>` + `useRound.winning_numbers`).
 *
 *             Data shape:
 *               - Outer list: `useWalletTickets` (paginated across rounds)
 *               - Expanded detail: `useRound(roundId)` fires only after the
 *                 user expands the card (settled rounds are immutable, so
 *                 the round detail is cached forever once fetched)
 *
 *             Excludes the current drawing (`<CurrentDrawingTickets>`
 *             handles that). Hides the entire section for wallets that
 *             haven't played any past round — matches the
 *             `<WalletStatsCard>` "hide for empty wallets" pattern.
 *
 *             Matched-ball invariant: every TicketCard rendered here
 *             receives `winningNormals` + `winningBonusball` so even
 *             losing tickets show which (if any) of the user's balls hit.
 * ---
 */
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { DataApiCredit } from '@/components/common/DataApiCredit';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useJackpotState } from '@/hooks/useJackpotState';
import { useRound } from '@/hooks/useRound';
import { useWalletTickets, type WalletTicketsByRound } from '@/hooks/useWalletTickets';
import { formatApiError, type Ticket } from '@/lib/api';

export function PastRoundTickets() {
  const { address } = useAccount();
  const { drawingId } = useJackpotState();
  const { groupedByRound, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useWalletTickets(address, {
      excludeRoundId: drawingId?.toString(),
    });

  if (!address) return null;
  // Hide section entirely for wallets that haven't played a past round.
  // Matches the `<WalletStatsCard>` empty-wallet pattern.
  if (!isLoading && !error && groupedByRound.length === 0) return null;

  return (
    <section className="card-pad space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Past round tickets</h2>
        <DataApiCredit />
      </header>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Couldn't load past tickets — {formatApiError(error)}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-zinc-500">Loading past tickets…</p>
      ) : (
        <div className="space-y-2">
          {groupedByRound.map((row) => (
            <PastRoundCard key={row.roundId} row={row} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more rounds'}
          </button>
        </div>
      )}
    </section>
  );
}

function PastRoundCard({ row }: { row: WalletTicketsByRound }) {
  // Native <details>/<summary> for the disclosure — semantic, accessible,
  // and the browser handles open/close state. The `onToggle` listener
  // mirrors that state so the inner detail subcomponent (which fires the
  // lazy `useRound`) only mounts on first open.
  const [expanded, setExpanded] = useState(false);

  const winsLabel =
    row.winsCount === 0 ? '0 wins' : `${row.winsCount} ${row.winsCount === 1 ? 'win' : 'wins'}`;

  return (
    <details
      className="group rounded-lg border border-zinc-200 dark:border-zinc-800"
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-xs">
        <span className="font-mono text-zinc-700 dark:text-zinc-300">Drawing #{row.roundId}</span>
        <span className="flex items-baseline gap-2 text-zinc-500">
          <span>
            {row.ticketCount} {row.ticketCount === 1 ? 'ticket' : 'tickets'}
          </span>
          <span>·</span>
          <span>{winsLabel}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">
            <UsdcAmount value={row.totalWinnings} precision={2} />
          </span>
        </span>
      </summary>

      {expanded && <PastRoundDetail roundId={row.roundId} tickets={row.tickets} />}
    </details>
  );
}

function PastRoundDetail({ roundId, tickets }: { roundId: string; tickets: Ticket[] }) {
  const roundQuery = useRound(roundId);
  const winningNormals = roundQuery.data?.winning_numbers?.normals;
  const winningBonusball = roundQuery.data?.winning_numbers?.bonusball;

  return (
    <div className="space-y-1 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
      {roundQuery.isLoading && <p className="text-[11px] text-zinc-500">Loading match details…</p>}
      {tickets.map((t) => {
        const tierId =
          t.matched_normals !== null
            ? t.matched_normals * 2 + (t.bonusball_match ? 1 : 0)
            : undefined;
        const winnings = t.winnings_amount !== null ? BigInt(t.winnings_amount.amount) : undefined;
        const isWinner = winnings !== undefined && winnings > 0n;
        const claimable = !t.claimed && isWinner;
        return (
          <TicketCard
            key={t.id}
            ticketId={BigInt(t.user_ticket_id)}
            normals={t.normals}
            bonusball={t.bonusball}
            winningNormals={winningNormals}
            winningBonusball={winningBonusball}
            tierId={tierId}
            claimable={claimable}
            winnings={isWinner ? winnings : undefined}
            claimed={isWinner ? t.claimed : undefined}
          />
        );
      })}
    </div>
  );
}
