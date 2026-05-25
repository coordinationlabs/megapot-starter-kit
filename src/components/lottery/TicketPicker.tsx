/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 * @customize  Modal ball-grid picker for a single custom ticket. Owns a local
 *             draft initialized from the `ticket` prop each time it opens.
 *             Save commits the draft via `onSave`; Close discards.
 *
 *             Shuffle re-rolls the entire ticket (normals + bonusball). Clear
 *             empties the draft. Save is disabled until 5 unique normals + 1
 *             bonusball are picked; the disabled label doubles as the
 *             validation hint.
 * ---
 */
import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Ball } from '@/components/lottery/Ball';
import { BONUSBALL_MIN } from '@/config/contracts';
import { type CustomTicket, isValidTicket, randomTicket } from '@/lib/tickets';

export function TicketPicker({
  open,
  onClose,
  onSave,
  ticket,
  bounds,
  index,
  total,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: CustomTicket) => void;
  ticket: CustomTicket;
  bounds: { ballMax: number; bonusballMax: number };
  index?: number;
  total?: number;
}) {
  const [draftNormals, setDraftNormals] = useState<Set<number>>(() => new Set(ticket.normals));
  const [draftBonus, setDraftBonus] = useState<number | null>(
    ticket.bonusball >= BONUSBALL_MIN ? ticket.bonusball : null,
  );

  // Re-initialize draft from the ticket each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setDraftNormals(new Set(ticket.normals));
    setDraftBonus(ticket.bonusball >= BONUSBALL_MIN ? ticket.bonusball : null);
  }, [open, ticket]);

  const toggleNormal = (n: number) => {
    setDraftNormals((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (next.size < 5) {
        next.add(n);
      }
      return next;
    });
  };

  const shuffleAll = () => {
    const r = randomTicket(bounds);
    setDraftNormals(new Set(r.normals));
    setDraftBonus(r.bonusball);
  };

  const clearAll = () => {
    setDraftNormals(new Set());
    setDraftBonus(null);
  };

  const valid =
    draftNormals.size === 5 &&
    draftBonus !== null &&
    isValidTicket({ normals: [...draftNormals], bonusball: draftBonus }, bounds);

  const saveLabel =
    draftNormals.size < 5
      ? `Pick ${5 - draftNormals.size} more · ${draftNormals.size} of 5`
      : draftBonus === null
        ? 'Pick a bonus'
        : 'Save ticket';

  const handleSave = () => {
    if (!valid || draftBonus === null) return;
    onSave({ normals: [...draftNormals].sort((a, b) => a - b), bonusball: draftBonus });
    onClose();
  };

  const normalRange = Array.from({ length: bounds.ballMax }, (_, i) => i + 1);
  const bonusRange = Array.from(
    { length: bounds.bonusballMax - BONUSBALL_MIN + 1 },
    (_, i) => i + BONUSBALL_MIN,
  );

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Pick your numbers">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-semibold">Pick your numbers</h3>
          {index !== undefined && total !== undefined && total > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500">
              Ticket {index + 1} of {total}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Numbers
            </h4>
            <span aria-live="polite" className="text-[11px] tabular-nums text-zinc-500">
              · {draftNormals.size} of 5
            </span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={shuffleAll}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              ↻ Shuffle
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-6 gap-2 sm:grid-cols-8">
          {normalRange.map((n) => (
            <Ball
              key={n}
              n={n}
              size="fill"
              selected={draftNormals.has(n)}
              interactive
              onClick={() => toggleNormal(n)}
              ariaLabel={`${n}, ${draftNormals.has(n) ? 'selected' : 'not selected'}`}
            />
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Bonus
            </h4>
            <span aria-live="polite" className="text-[11px] tabular-nums text-zinc-500">
              · {draftBonus === null ? 0 : 1} of 1
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {bonusRange.map((n) => (
            <Ball
              key={n}
              n={n}
              variant="bonus"
              size="fill"
              selected={draftBonus === n}
              interactive
              onClick={() => setDraftBonus(n)}
              ariaLabel={`Bonus ${n}, ${draftBonus === n ? 'selected' : 'not selected'}`}
            />
          ))}
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={handleSave}
          disabled={!valid}
          aria-disabled={!valid}
          className={
            'w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ' +
            (valid
              ? 'bg-brand-primary-600 text-white shadow-sm hover:bg-brand-primary-700 active:shadow-none'
              : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500')
          }
        >
          {saveLabel}
        </button>
      </footer>
    </Modal>
  );
}
