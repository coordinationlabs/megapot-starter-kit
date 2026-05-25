/**
 * ---
 * @skill      https://llms.megapot.io/tasks/subscribe
 * @customize  Mode switch + subscription duration input. Cost is computed by
 *             the parent (Play page) and passed in for display.
 *
 *             Tabs use `brand-primary` tokens for both states — the active
 *             tab is solid `brand-primary-600`, inactive is `brand-primary-600/10`
 *             (10% opacity) so a fork's brand-color swap automatically
 *             propagates here without any string edits in this file.
 * ---
 */
import { MAX_DAYS_SUBSCRIPTION } from '@/lib/tickets';

export type BuyMode = 'one-time' | 'subscription';

export function SubscriptionToggle({
  mode,
  onModeChange,
  totalDays,
  onTotalDaysChange,
  disabled,
}: {
  mode: BuyMode;
  onModeChange: (m: BuyMode) => void;
  totalDays: number;
  onTotalDaysChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Purchase mode"
        className="grid grid-cols-2 gap-0.5 rounded-lg bg-brand-primary-600/10 p-0.5 text-sm dark:bg-brand-primary-400/10"
      >
        {(['one-time', 'subscription'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => onModeChange(m)}
            disabled={disabled}
            className={
              'rounded-md px-3 py-1.5 font-medium transition-colors disabled:opacity-50 ' +
              (mode === m
                ? 'bg-brand-primary-600 text-white shadow-sm hover:bg-brand-primary-700'
                : 'text-brand-primary-800 hover:bg-brand-primary-600/10 dark:text-brand-primary-100 dark:hover:bg-brand-primary-400/10')
            }
          >
            {m === 'one-time' ? 'One-time' : 'Subscription'}
          </button>
        ))}
      </div>

      {mode === 'subscription' && (
        <div>
          <div className="flex items-baseline justify-between">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: decorative section heading; the <input type="range"> below is self-labeled */}
            <label className="text-xs uppercase tracking-wide text-zinc-500">Drawings</label>
            <span className="text-lg font-semibold tabular-nums">{totalDays}</span>
          </div>
          <input
            type="range"
            min={1}
            max={MAX_DAYS_SUBSCRIPTION}
            value={totalDays}
            onChange={(e) => onTotalDaysChange(Number(e.target.value))}
            disabled={disabled}
            className="mt-1 w-full accent-brand-primary-600"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Tickets are auto-purchased each drawing for {totalDays}{' '}
            {totalDays === 1 ? 'drawing' : 'drawings'}. USDC is locked upfront. Cancel anytime —
            unused balance is refunded.
          </p>
        </div>
      )}
    </div>
  );
}
