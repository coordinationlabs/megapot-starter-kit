/**
 * ---
 * @customize  Flash a brief "✓ Done!" window after a write confirms, then
 *             auto-reset the underlying write hook so the submit button
 *             returns to its idle label.
 *
 *             Used at every submit-button site to give the user explicit
 *             visual confirmation that the tx landed — without it the
 *             button just snaps from "Confirming on-chain…" back to its
 *             default label, which reads as "nothing happened".
 *
 *             Usage:
 *               const flashing = useConfirmedFlash(buy.isSuccess, buy.reset);
 *               ...
 *               {flashing ? '✓ Bought!' : `Buy ${count} tickets`}
 * ---
 */
import { useEffect, useState } from 'react';

export function useConfirmedFlash(isSuccess: boolean, reset: () => void, delayMs = 2000) {
  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    if (!isSuccess) return;
    setFlashing(true);
    const id = setTimeout(() => {
      setFlashing(false);
      reset();
    }, delayMs);
    return () => clearTimeout(id);
  }, [isSuccess, reset, delayMs]);
  return flashing;
}
