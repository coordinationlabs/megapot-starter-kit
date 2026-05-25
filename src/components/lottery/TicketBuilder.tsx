/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 * @customize  Quantity slider + up to 10 custom tickets (rest auto-random).
 *             Custom tickets persist across qty changes. Random tickets
 *             regenerate when ballMax / bonusballMax / qty change.
 *             Validation matches the contract: 5 unique normals in
 *             [1, ballMax], bonusball in [BONUSBALL_MIN, bonusballMax].
 * ---
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ball } from '@/components/lottery/Ball';
import { TicketPicker } from '@/components/lottery/TicketPicker';
import {
  type CustomTicket,
  isValidTicket,
  MAX_CUSTOM_TICKETS,
  MAX_QTY_ONE_TIME,
  randomTicket,
} from '@/lib/tickets';

export function TicketBuilder({
  ballMax,
  bonusballMax,
  count,
  onCountChange,
  customTickets,
  onCustomTicketsChange,
  maxQty = MAX_QTY_ONE_TIME,
  showSlider = true,
}: {
  ballMax: number | undefined;
  bonusballMax: number | undefined;
  count: number;
  onCountChange: (n: number) => void;
  customTickets: CustomTicket[];
  onCustomTicketsChange: (tickets: CustomTicket[]) => void;
  maxQty?: number;
  showSlider?: boolean;
}) {
  const customCount = customTickets.length;
  const randomCount = Math.max(0, count - customCount);

  // Random tickets are presentational — actual random logic happens at submit
  // time (the contract treats `normals: [], bonusball: 0` as quick-pick).
  // We render *placeholder* random rows to make the breakdown legible.
  const [randomDisplay, setRandomDisplay] = useState<CustomTicket[]>([]);
  const [pickerOpenIndex, setPickerOpenIndex] = useState<number | null>(null);

  // Regenerate the whole preview when the ball pool changes (different valid
  // range); on randomCount changes alone, grow or shrink the preview in
  // place so existing rows don't reshuffle on every slider tick.
  const boundsKey = `${ballMax ?? 'x'}:${bonusballMax ?? 'x'}`;
  const prevBoundsKey = useRef(boundsKey);
  useEffect(() => {
    if (ballMax === undefined || bonusballMax === undefined) {
      setRandomDisplay([]);
      prevBoundsKey.current = boundsKey;
      return;
    }
    const boundsChanged = prevBoundsKey.current !== boundsKey;
    prevBoundsKey.current = boundsKey;
    setRandomDisplay((prev) => {
      if (boundsChanged) {
        return Array.from({ length: randomCount }, () => randomTicket({ ballMax, bonusballMax }));
      }
      if (randomCount === prev.length) return prev;
      if (randomCount < prev.length) return prev.slice(0, randomCount);
      const more = Array.from({ length: randomCount - prev.length }, () =>
        randomTicket({ ballMax, bonusballMax }),
      );
      return [...prev, ...more];
    });
  }, [randomCount, ballMax, bonusballMax, boundsKey]);

  const bounds = useMemo(
    () => (ballMax !== undefined && bonusballMax !== undefined ? { ballMax, bonusballMax } : null),
    [ballMax, bonusballMax],
  );

  const addCustom = () => {
    if (!bounds || customCount >= MAX_CUSTOM_TICKETS) return;
    onCustomTicketsChange([
      ...customTickets,
      randomTicket(bounds), // seed with valid random — user edits inline
    ]);
    if (count < customCount + 1) onCountChange(customCount + 1);
  };

  const updateCustom = (idx: number, next: CustomTicket) => {
    onCustomTicketsChange(customTickets.map((t, i) => (i === idx ? next : t)));
  };

  const removeCustom = (idx: number) => {
    onCustomTicketsChange(customTickets.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {showSlider && (
        <div>
          <div className="flex items-baseline justify-between">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: decorative section heading; the <input type="range"> below is self-labeled via aria-label */}
            <label className="text-xs uppercase tracking-wide text-zinc-500">Tickets</label>
            <span className="text-2xl font-semibold tabular-nums">{count}</span>
          </div>
          <input
            type="range"
            min={Math.max(1, customCount)}
            max={maxQty}
            value={count}
            onChange={(e) => onCountChange(Number(e.target.value))}
            className="mt-1 w-full accent-brand-primary-600"
          />
          <p className="text-xs text-zinc-500 mt-1">
            {customCount} custom · {randomCount} random
          </p>
        </div>
      )}

      <div className="space-y-2">
        {customTickets.map((t, idx) => (
          <CustomTicketRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional (slot N == row N); no reordering
            key={idx}
            ticket={t}
            bounds={bounds}
            onEdit={() => setPickerOpenIndex(idx)}
            onRemove={() => removeCustom(idx)}
          />
        ))}

        {customCount < MAX_CUSTOM_TICKETS && (
          <button
            type="button"
            onClick={addCustom}
            disabled={!bounds}
            className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
          >
            + Add custom ticket ({customCount}/{MAX_CUSTOM_TICKETS})
          </button>
        )}
      </div>

      {randomCount > 0 && (
        <details className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
          <summary className="cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {randomCount} random {randomCount === 1 ? 'ticket' : 'tickets'} (preview)
          </summary>
          <div className="mt-2 space-y-1.5">
            {randomDisplay.map((t, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: ephemeral preview list, append/pop only — index is the natural slot
                key={i}
                className="flex items-center gap-1"
              >
                {t.normals.map((n, j) => (
                  <Ball
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-position normal-ball slot
                    key={j}
                    n={n}
                    size="sm"
                  />
                ))}
                <span className="px-0.5 text-[11px] text-zinc-400">·</span>
                <Ball n={t.bonusball} variant="bonus" size="sm" />
              </div>
            ))}
          </div>
        </details>
      )}

      {bounds && pickerOpenIndex !== null && customTickets[pickerOpenIndex] && (
        <TicketPicker
          open
          onClose={() => setPickerOpenIndex(null)}
          onSave={(next) => {
            updateCustom(pickerOpenIndex, next);
            setPickerOpenIndex(null);
          }}
          ticket={customTickets[pickerOpenIndex]}
          bounds={bounds}
          index={pickerOpenIndex}
          total={customTickets.length}
        />
      )}
    </div>
  );
}

function CustomTicketRow({
  ticket,
  bounds,
  onEdit,
  onRemove,
}: {
  ticket: CustomTicket;
  bounds: { ballMax: number; bonusballMax: number } | null;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const valid = bounds ? isValidTicket(ticket, bounds) : true;

  return (
    // biome-ignore lint/a11y/useSemanticElements: nested ✕ button precludes a real <button> wrapper; keyboard handlers below cover Enter/Space activation
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
      className={
        'flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors ' +
        'hover:bg-zinc-50 dark:hover:bg-zinc-900 ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ' +
        (valid ? 'border-zinc-200 dark:border-zinc-800' : 'border-rose-300 dark:border-rose-900')
      }
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {ticket.normals.map((n, i) => (
          <Ball
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-position normal-ball slot
            key={i}
            n={n}
            selected
          />
        ))}
        <span className="px-0.5 text-zinc-400">·</span>
        <Ball n={ticket.bonusball} variant="bonus" selected />
      </div>
      <span aria-hidden className="text-zinc-400 dark:text-zinc-500" title="Tap to edit">
        ✎
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded p-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Remove ticket"
      >
        ✕
      </button>
    </div>
  );
}
