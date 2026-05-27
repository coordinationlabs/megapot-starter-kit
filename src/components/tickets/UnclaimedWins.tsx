/**
 * ---
 * @skill      https://llms.megapot.io/data-api § Recipe 6 "Unclaimed-Wins Feed"
 *             https://llms.megapot.io/tasks/claim-winnings
 * @customize  Reads the wallet's unclaimed wins from
 *             `GET /v1/wallets/{address}/wins?claimed=false` — one paginated
 *             call across every past drawing — instead of running the
 *             per-drawing 5-read RPC pipeline the v0 build did. The page
 *             groups by round_id and offers a per-round Claim button.
 *
 *             Wins-only by definition: a wallet's losing tickets are
 *             intentionally hidden here. Lifetime history aggregates live
 *             on `WalletStatsCard`; per-round historical record lives on
 *             `PastRoundTickets`. To list every win regardless of claim
 *             state, omit the `claimed` filter from `useWalletWins`.
 *
 *             Matched-ball highlighting: each row renders via `<TicketCard>`
 *             with `winningNormals` + `winningBonusball` from `useRound`
 *             so the user sees exactly which of their balls hit. The
 *             round detail is cached forever (settled rounds are
 *             immutable).
 *
 *             Claim batch cap: `MAX_CLAIM_BATCH = 50` is enforced at both
 *             the hook and UI levels — a round with more than 50 unclaimed
 *             wins shows a "claim 50 now, N more after" affordance and
 *             relies on the post-claim refetch to surface the next chunk.
 *
 *             Claiming still happens on-chain via `useClaimWinnings` — the
 *             API supplies the on-chain `user_ticket_id` we need to pass.
 *
 *             Tier-0/2 safety: the `/wins` endpoint already filters to
 *             paying tiers, so every row we render is claim-safe. If the API
 *             ever returned a `claimed=false` row for a non-paying tier
 *             (e.g. mid-settlement race), `Jackpot.claimWinnings` reverts the
 *             whole batch — not silently. Forks that want belt-and-suspenders
 *             validation can layer a `Jackpot.getTicketTierIds` read on top.
 * ---
 */
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/common/Button';
import { DataApiCredit } from '@/components/common/DataApiCredit';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { TicketCard } from '@/components/tickets/TicketCard';
import { COPY } from '@/config/copy';
import { useClaimWinnings } from '@/hooks/useClaimWinnings';
import { useRound } from '@/hooks/useRound';
import { useWalletWins, type WinsByRound } from '@/hooks/useWalletWins';
import { formatApiError } from '@/lib/api';
import { MAX_CLAIM_BATCH } from '@/lib/tickets';

function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UnclaimedWins() {
  const { address } = useAccount();
  const { grouped, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useWalletWins(address, { claimed: false });

  if (!address) return null;

  return (
    <section className="card-pad space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{COPY.unclaimedWinsHeading}</h2>
        <DataApiCredit />
      </header>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Couldn't load wins — {formatApiError(error)}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-zinc-500">Loading wins…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No unclaimed wins. Past tickets that didn't win aren't shown here.
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map((row) => (
            <UnclaimedRoundRow key={row.roundId} row={row} onClaimed={refetch} />
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
            {isFetchingNextPage ? 'Loading…' : 'Load more wins'}
          </button>
        </div>
      )}
    </section>
  );
}

function UnclaimedRoundRow({ row, onClaimed }: { row: WinsByRound; onClaimed: () => void }) {
  const claim = useClaimWinnings();
  // Settled-round detail (winning_numbers) is cached forever — first
  // expansion fetches, subsequent renders are free.
  const roundQuery = useRound(row.roundId);

  // The `if (!claim.isSuccess) return;` early-out keeps re-runs harmless even
  // though `claim` is a fresh object every render and `onClaimed` may be too —
  // the gate stays false on every re-run except the actual success transition.
  useEffect(() => {
    if (!claim.isSuccess) return;
    onClaimed();
    claim.reset();
  }, [claim.isSuccess, claim.reset, onClaimed]);

  const winningNormals = roundQuery.data?.winning_numbers?.normals;
  const winningBonusball = roundQuery.data?.winning_numbers?.bonusball;

  // Cap claim batch at MAX_CLAIM_BATCH (50). The hook also enforces this
  // as a safety net; the UI surfaces it so users know what's happening.
  const overCap = row.wins.length > MAX_CLAIM_BATCH;
  const claimableWins = row.wins.slice(0, MAX_CLAIM_BATCH);
  const claimableTotal = claimableWins.reduce((s, w) => s + BigInt(w.amount.amount), 0n);
  const unclaimedTicketIds = claimableWins.map((w) => BigInt(w.user_ticket_id));
  const remainingAfterClaim = row.wins.length - claimableWins.length;

  // ISO-8601 + Z sorts chronologically the same as lexicographically, but
  // converting to epoch ms is the less-footgun way to find the earliest.
  const earliestMs = row.wins.reduce<number>((min, w) => {
    const t = new Date(w.created_at).getTime();
    return t < min ? t : min;
  }, Number.POSITIVE_INFINITY);
  const earliestIso = Number.isFinite(earliestMs) ? new Date(earliestMs).toISOString() : null;

  return (
    <article className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <header className="flex items-baseline justify-between text-xs">
        <span className="font-mono text-zinc-500">Drawing #{row.roundId}</span>
        <span className="text-zinc-500">{fmtDate(earliestIso)}</span>
      </header>

      {roundQuery.isLoading && <p className="text-[11px] text-zinc-500">Loading match details…</p>}

      <div className="space-y-1">
        {row.wins.map((w) => (
          <TicketCard
            key={w.id}
            ticketId={BigInt(w.user_ticket_id)}
            normals={w.normals}
            bonusball={w.bonusball}
            winningNormals={winningNormals}
            winningBonusball={winningBonusball}
            tierId={w.matched_normals * 2 + (w.bonusball_match ? 1 : 0)}
            claimable
            winnings={BigInt(w.amount.amount)}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
        <span className="text-zinc-500">
          Total · {row.wins.length} {row.wins.length === 1 ? 'win' : 'wins'}
        </span>
        <span className="font-mono tabular-nums font-semibold">
          <UsdcAmount value={row.totalAmount} precision={2} />
        </span>
      </div>

      <div className="space-y-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => claim.claim(unclaimedTicketIds)}
          disabled={claim.isPending}
          className="w-full"
        >
          {claim.isWaitingSignature ? (
            'Sign in your wallet…'
          ) : claim.isMining ? (
            'Confirming on-chain…'
          ) : (
            <>
              Claim {claimableWins.length} {claimableWins.length === 1 ? 'win' : 'wins'} ·{' '}
              <UsdcAmount value={claimableTotal} precision={2} />
            </>
          )}
        </Button>
        {overCap && !claim.isPending && (
          <p className="text-center text-[11px] text-zinc-500">
            {remainingAfterClaim} more {remainingAfterClaim === 1 ? 'win' : 'wins'} after this batch
            — claim again once the first batch confirms.
          </p>
        )}
        <TxStatus
          hash={claim.txHash}
          isPending={claim.isPending}
          isSuccess={claim.isSuccess}
          error={claim.error}
        />
      </div>
    </article>
  );
}
