/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @endpoint   GET /v1/wallets/{address}/stats
 * @customize  Lifetime aggregate card — total tickets, total wins, total
 *             winnings, total spent. Single API call, no RPC fan-out.
 *
 *             Hidden for unknown wallets (zero tickets) so the section
 *             doesn't claim activity that doesn't exist. On API error we
 *             render a small unobtrusive note rather than vanishing —
 *             a silent disappear looks like a layout bug.
 *
 *             "Spent vs. won" intentionally renders the two figures
 *             side-by-side rather than a single "net P&L" cell. The API's
 *             `total_spent` aggregates ticket purchases by the recipient
 *             wallet — it doesn't account for referral fees, gas, or
 *             subscription pre-pays that haven't yet executed — so a true
 *             net would be misleading. Two figures keeps the math honest.
 * ---
 */
import { DataApiCredit } from '@/components/common/DataApiCredit';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { useWalletStats } from '@/hooks/useWalletStats';
import { amountToBigInt, formatApiError } from '@/lib/api';

export function WalletStatsCard({ address }: { address: `0x${string}` }) {
  const { stats, isLoading, error } = useWalletStats(address);

  const winnings = amountToBigInt(stats?.total_winnings);
  const spent = amountToBigInt(stats?.total_spent);
  const referralEarnings = amountToBigInt(stats?.total_referral_earnings);
  const showReferralEarnings = referralEarnings !== undefined && referralEarnings > 0n;

  // Hide for "empty" wallets — no tickets AND no referral earnings — to
  // avoid a "0 / 0 / $0 / $0" card on first visit. A pure referrer with
  // earnings but no purchases still gets the card so they can see what
  // they've earned.
  if (!isLoading && !error && (!stats || (stats.total_tickets === 0 && !showReferralEarnings))) {
    return null;
  }

  return (
    <section className="card-pad" aria-label="Wallet lifetime stats">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Lifetime stats</h2>
        <DataApiCredit />
      </header>

      {error ? (
        <p className="text-xs text-zinc-500">
          Lifetime stats unavailable — {formatApiError(error)}
        </p>
      ) : isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Tickets" value={stats.total_tickets.toLocaleString()} />
            <Stat label="Wins" value={stats.total_wins.toLocaleString()} />
            <Stat label="Total spent" value={<UsdcAmount value={spent} precision={2} />} />
            <Stat label="Total winnings" value={<UsdcAmount value={winnings} precision={2} />} />
          </dl>
          {showReferralEarnings && (
            <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
              Lifetime referral earnings:{' '}
              <span className="font-mono font-medium text-zinc-700 tabular-nums dark:text-zinc-300">
                <UsdcAmount value={referralEarnings} precision={2} />
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold tabular-nums md:text-xl">{value}</dd>
    </div>
  );
}
