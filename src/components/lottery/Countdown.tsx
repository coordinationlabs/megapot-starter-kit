/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Ticks once per second client-side; the source of truth for
 *             phase transitions is useJackpotState (poll + events).
 * ---
 */
import { useEffect, useState } from 'react';

function partitionSeconds(total: number) {
  const t = Math.max(0, total);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return { h, m, s };
}

const pad = (n: number) => n.toString().padStart(2, '0');

export function Countdown({
  drawingTimeUnix,
}: {
  /** Drawing time as a unix-seconds bigint (from `useJackpotState().state.drawingTime`). */
  drawingTimeUnix: bigint | undefined;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  if (drawingTimeUnix === undefined) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        Loading…
      </p>
    );
  }

  const remaining = Number(drawingTimeUnix) - now;
  const { h, m, s } = partitionSeconds(remaining);

  return (
    <p
      className="text-2xl font-mono font-semibold tabular-nums"
      role="timer"
      aria-live="polite"
      aria-label={
        remaining <= 0 ? 'Drawing time reached' : `${h} hours ${m} minutes ${s} seconds remaining`
      }
    >
      {pad(h)}:{pad(m)}:{pad(s)}
    </p>
  );
}
