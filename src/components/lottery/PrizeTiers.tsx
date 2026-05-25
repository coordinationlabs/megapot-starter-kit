/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 *             https://llms.megapot.io/data-api
 * @customize  Pure-display tier table. Accepts a normalized `TierRow[]` so
 *             the same component renders both:
 *               - Live projected payouts (Home page) — RPC
 *                 `getExpectedDrawingTierPayouts` returns a `bigint[12]` with
 *                 no per-tier ticket counts.
 *               - Settled actual payouts (History expand) — API
 *                 `Round.prize_tiers` returns 12 objects with `payout` +
 *                 `ticket_count`.
 *
 *             Tier formula: `tierId = normalMatches * 2 + (bonusball ? 1 : 0)`.
 *             Tiers 0 and 2 are non-paying — always hidden (no toggle).
 *
 *             Order: largest prize first. Players scan top-down expecting the
 *             jackpot row at the top.
 *
 *             `footnote` is an optional caption rendered below the table —
 *             used by Home to explain the gross → net referral-share math
 *             (`usePrizeTiers({ referralWinShare })`).
 * ---
 */
import type { ReactNode } from 'react';
import { UsdcAmount } from '@/components/common/UsdcAmount';

/** Normalized tier row — RPC and API consumers both flatten to this. */
export type TierRow = {
  tierId: number;
  payout: bigint | undefined;
  /** Optional — only present when the tier data came from the API. */
  ticketCount?: number;
};

type Tier = { id: number; label: string };

const TIERS: Tier[] = [
  { id: 11, label: '5 + bonus' },
  { id: 10, label: '5 of 5' },
  { id: 9, label: '4 + bonus' },
  { id: 8, label: '4 of 5' },
  { id: 7, label: '3 + bonus' },
  { id: 6, label: '3 of 5' },
  { id: 5, label: '2 + bonus' },
  { id: 4, label: '2 of 5' },
  { id: 3, label: '1 + bonus' },
  { id: 1, label: 'Bonus only' },
];

export function PrizeTiers({
  tiers,
  flat = false,
  footnote,
}: {
  tiers: readonly TierRow[] | undefined;
  /** Drop the card chrome — for embedding inside another card (e.g. History detail). */
  flat?: boolean;
  /** Optional caption rendered below the table (e.g. referral-share math note). */
  footnote?: ReactNode;
}) {
  const byTier = new Map<number, TierRow>();
  if (tiers) for (const t of tiers) byTier.set(t.tierId, t);
  const showWinnerCounts = tiers?.some((t) => t.ticketCount !== undefined) ?? false;

  return (
    <section className={flat ? '' : 'card-pad'}>
      <header className="mb-3 flex items-baseline justify-between text-xs uppercase tracking-wide text-zinc-500">
        <span>Ticket prize tiers</span>
        <span>USDC</span>
      </header>
      <table className="w-full table-fixed text-sm">
        <tbody>
          {TIERS.map((t) => {
            const row = byTier.get(t.id);
            return (
              <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-1 py-2 text-zinc-600 dark:text-zinc-400">{t.label}</td>
                {showWinnerCounts && (
                  <td className="px-1 py-2 text-right text-[11px] text-zinc-500 tabular-nums sm:text-xs">
                    {row?.ticketCount !== undefined && row.ticketCount > 0
                      ? `${row.ticketCount} won`
                      : ''}
                  </td>
                )}
                <td className="px-1 py-2 text-right font-mono text-[13px] tabular-nums whitespace-nowrap sm:text-sm">
                  <UsdcAmount value={row?.payout} precision={2} unit={false} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {footnote && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {footnote}
        </p>
      )}
    </section>
  );
}
