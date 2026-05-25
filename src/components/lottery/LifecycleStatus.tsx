/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Five-phase banner. `useJackpotState` derives the phase from
 *             polled state; the `unlocked` flash is event-driven (settlement
 *             attempt failed, can be retried). Style per phase via the COLORS
 *             map below.
 *
 *             Title format is `Drawing #{id} {state}` so the id sits between
 *             the noun and its current state ("Drawing #42 open"). The two
 *             phases that aren't shaped that way (`awaiting`, `unlocked`)
 *             still embed the id but use a longer state phrase.
 * ---
 */
import type { LifecyclePhase } from '@/hooks/useJackpotState';

const COPY: Record<LifecyclePhase, { state: string; sub: string }> = {
  open: {
    state: 'open',
    sub: 'Tickets are being sold for current drawing.',
  },
  awaiting: {
    state: 'ready to settle',
    sub: 'Anyone can trigger settlement (calls runJackpot, ETH gas + entropy fee).',
  },
  settling: {
    state: 'settling…',
    sub: 'Awaiting on-chain randomness from the entropy oracle.',
  },
  settled: {
    state: 'settled',
    sub: 'Winning numbers revealed. Winners can claim from the Tickets page.',
  },
  unlocked: {
    state: 'settlement failed — retry available',
    sub: 'The drawing was unlocked — anyone can re-trigger settlement.',
  },
};

const COLORS: Record<LifecyclePhase, string> = {
  open: 'border-brand-primary-200 bg-white text-zinc-900 dark:border-brand-primary-900 dark:bg-zinc-900 dark:text-zinc-100',
  awaiting:
    'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
  settling:
    'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-100',
  settled:
    'border-brand-primary-300 bg-brand-primary-50 text-brand-primary-900 dark:border-brand-primary-900 dark:bg-brand-primary-950 dark:text-brand-primary-100',
  unlocked:
    'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100',
};

/**
 * Tiny dot before the title — gives the most-frequent phase ("open") an
 * obvious "all clear" cue without making the banner shouty.
 */
const DOTS: Record<LifecyclePhase, string> = {
  open: 'bg-brand-primary-500',
  awaiting: 'bg-amber-500',
  settling: 'bg-indigo-500',
  settled: 'bg-brand-primary-500',
  unlocked: 'bg-rose-500',
};

export function LifecycleStatus({
  phase,
  drawingId,
}: {
  phase: LifecyclePhase;
  drawingId: bigint | undefined;
}) {
  const c = COPY[phase];
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${COLORS[phase]}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${DOTS[phase]}`}
          aria-hidden="true"
        />
        <span>
          Drawing
          {drawingId !== undefined && (
            <>
              {' '}
              <span className="font-mono opacity-80">#{drawingId.toString()}</span>
            </>
          )}{' '}
          {c.state}
        </span>
      </p>
      <p className="mt-0.5 text-xs opacity-80">{c.sub}</p>
    </div>
  );
}
