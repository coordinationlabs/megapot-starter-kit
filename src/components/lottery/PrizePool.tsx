/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Pure display. Polling lives in useJackpotState; this component
 *             only renders the value passed in.
 * ---
 */
import { UsdcAmount } from '@/components/common/UsdcAmount';

export function PrizePool({ value }: { value: bigint | undefined }) {
  return (
    <section className="card-pad-lg text-center">
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Prize pool</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums break-words sm:text-3xl md:text-4xl">
        <UsdcAmount value={value} precision={2} />
      </p>
    </section>
  );
}
