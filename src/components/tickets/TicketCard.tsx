/**
 * ---
 * @skill      https://llms.megapot.io/data-api § "Round Shape"
 * @customize  Renders one ticket. Pass `winningNormals` + `winningBonusball`
 *             from `Round.winning_numbers` to highlight matched balls on
 *             past-drawing tickets; omit them on the current drawing.
 *
 *             Past-drawing winnings: pass `winnings` (raw 6-decimal USDC
 *             bigint) to show the per-ticket payout on settled rounds.
 *             A `claimed` flag adds a small "claimed" tag — distinguishes
 *             paid-out wins from claimable ones at a glance. Tickets that
 *             didn't win get nothing in this slot.
 * ---
 */
import { CopyButton } from '@/components/common/CopyButton';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { Ball } from '@/components/lottery/Ball';
import { matchOverlap } from '@/lib/tickets';

export function TicketCard({
  ticketId,
  normals,
  bonusball,
  winningNormals,
  winningBonusball,
  tierId,
  claimable,
  winnings,
  claimed,
}: {
  ticketId: bigint;
  normals: readonly number[];
  bonusball: number;
  winningNormals?: readonly number[];
  winningBonusball?: number;
  tierId?: number;
  claimable?: boolean;
  /** Per-ticket payout (raw 6-decimal USDC). Rendered only when > 0. */
  winnings?: bigint;
  /** Marks a winning ticket as already claimed — appends a faint "claimed" tag. */
  claimed?: boolean;
}) {
  const matches = winningNormals ? matchOverlap(normals, winningNormals) : null;
  const bonusMatched = winningBonusball !== undefined && bonusball === winningBonusball;
  const winningSet = winningNormals ? new Set(winningNormals) : null;
  const showWinnings = winnings !== undefined && winnings > 0n;

  return (
    <div
      className={
        'flex flex-col gap-1 rounded-lg border p-2 sm:flex-row sm:items-center sm:gap-2 ' +
        (claimable
          ? 'border-brand-primary-300 bg-brand-primary-50 dark:border-brand-primary-900 dark:bg-brand-primary-950/40'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900')
      }
    >
      <div className="flex min-w-0 items-center gap-1 font-mono text-sm tabular-nums sm:flex-1">
        {normals.map((n, i) => (
          <Ball
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-position normal-ball slot
            key={i}
            n={n}
            selected={winningSet?.has(n) ?? false}
          />
        ))}
        <span className="px-0.5 text-zinc-400">·</span>
        <Ball n={bonusball} variant="bonus" selected={bonusMatched} />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="font-mono" title={`Ticket #${ticketId}`}>
          #{ticketId.toString().slice(-4)}
        </span>
        <CopyButton value={ticketId.toString()} label="Copy ticket ID" className="h-4 w-4" />
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:ml-0">
          {tierId !== undefined && winningNormals && (
            <span>
              {matches}+{bonusMatched ? '★' : '·'} · tier {tierId}
            </span>
          )}
          {showWinnings && (
            <span className="font-mono font-semibold tabular-nums text-brand-primary-700 dark:text-brand-primary-400">
              <UsdcAmount value={winnings} precision={2} />
              {claimed && (
                <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">claimed</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
