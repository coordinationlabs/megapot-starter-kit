/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @contract   Jackpot.currentDrawingId + Jackpot.getDrawingState
 * @customize  Polling cadence per phase + 4 lifecycle event subscriptions for
 *             instant transitions. To swap to indexer-fed state, replace the
 *             useReadContract calls with your indexer query and keep the
 *             event subs to invalidate.
 * ---
 *
 * Hybrid lifecycle reader. Polls `getDrawingState` on a phase-aware cadence
 * and refetches immediately when any of `JackpotLocked`, `JackpotSettled`,
 * `NewDrawingInitialized`, or `JackpotUnlocked` fires.
 *
 * Returns `{ phase, state, drawingId, isLoading, refetch }` — call `refetch`
 * from write paths (LP withdraw, claim) to force a refresh after a confirming
 * tx without waiting for the next poll tick.
 *
 * See `read-state` skill → "Drawing Lifecycle UX & Events" for the canonical
 * subscription matrix and event signatures.
 */
import { useCallback, useEffect, useState } from 'react';
import { parseAbi } from 'viem';
import { useReadContract, useWatchContractEvent } from 'wagmi';
import { JACKPOT_ADDRESS } from '@/config/contracts';

const abi = parseAbi([
  'function currentDrawingId() view returns (uint256)',
  'function getDrawingState(uint256 _drawingId) view returns ((uint256 prizePool, uint256 ticketPrice, uint256 edgePerTicket, uint256 referralWinShare, uint256 referralFee, uint256 globalTicketsBought, uint256 lpEarnings, uint256 drawingTime, uint256 winningTicket, uint8 ballMax, uint8 bonusballMax, address payoutCalculator, bool jackpotLock))',
  'event JackpotLocked(uint256 indexed drawingId)',
  'event JackpotUnlocked(uint256 indexed drawingId)',
  'event JackpotSettled(uint256 indexed drawingId, uint256 lpEarnings, uint256 userWinnings, uint8 winningBonusball, uint256 winningNumbers, uint256 newDrawingAccumulator)',
  'event NewDrawingInitialized(uint256 indexed drawingId, uint256 lpPoolTotal, uint256 prizePool, uint256 ticketPrice, uint256 normalBallMax, uint8 bonusballMax, uint256 referralWinShare, uint256 drawingTime)',
]);

export type LifecyclePhase = 'open' | 'awaiting' | 'settling' | 'settled' | 'unlocked';

/**
 * Snapshot of one drawing's state from the Jackpot contract. The bigint
 * fields carry implicit units — documented here once so consumers don't
 * have to chase the contract source:
 *
 * - `prizePool`, `ticketPrice`, `edgePerTicket`, `referralFee`, `lpEarnings`
 *   are raw 6-decimal USDC bigints (divide by 10**6 for display).
 * - `referralWinShare` is 1e18-scaled — divide by `1_000_000_000_000_000_000n`
 *   for the fraction, or multiply by 100 (after Number()) for a percent.
 * - `globalTicketsBought` is an integer ticket count.
 * - `drawingTime` is a unix-seconds timestamp.
 * - `winningTicket` is the drawn ticket id (non-zero ⇒ settled).
 * - `ballMax` / `bonusballMax` are number-typed pool bounds.
 */
export type DrawingState = {
  prizePool: bigint;
  ticketPrice: bigint;
  edgePerTicket: bigint;
  referralWinShare: bigint;
  referralFee: bigint;
  globalTicketsBought: bigint;
  lpEarnings: bigint;
  drawingTime: bigint;
  winningTicket: bigint;
  ballMax: number;
  bonusballMax: number;
  payoutCalculator: `0x${string}`;
  jackpotLock: boolean;
};

function derivePhase(state: DrawingState | undefined): LifecyclePhase {
  if (!state) return 'open';
  if (state.winningTicket !== 0n) return 'settled';
  if (state.jackpotLock) return 'settling';
  if (Number(state.drawingTime) <= Math.floor(Date.now() / 1000)) return 'awaiting';
  return 'open';
}

export function useJackpotState() {
  const [unlockedFlash, setUnlockedFlash] = useState(false);

  const drawingIdQuery = useReadContract({
    address: JACKPOT_ADDRESS,
    abi,
    functionName: 'currentDrawingId',
  });
  const drawingId = drawingIdQuery.data;

  const stateQuery = useReadContract({
    address: JACKPOT_ADDRESS,
    abi,
    functionName: 'getDrawingState',
    args: drawingId !== undefined ? [drawingId] : undefined,
    query: {
      enabled: drawingId !== undefined,
      // Phase-aware cadence: 30s while open (state changes slowly — only
      // ticket counts move); 5s during awaiting/settling (countdown +
      // entropy callback can fire any second); off once settled because
      // settled state is immutable. Event subs below cover any gap.
      refetchInterval: (query) => {
        const data = query.state.data as DrawingState | undefined;
        const phase = derivePhase(data);
        if (phase === 'settled') return false;
        return phase === 'open' ? 30_000 : 5_000;
      },
    },
  });

  const { refetch: refetchDrawingId } = drawingIdQuery;
  const { refetch: refetchState } = stateQuery;
  const refetchAll = useCallback(() => {
    refetchDrawingId();
    refetchState();
  }, [refetchDrawingId, refetchState]);

  useEffect(() => {
    if (!unlockedFlash) return;
    const id = setTimeout(() => setUnlockedFlash(false), 3000);
    return () => clearTimeout(id);
  }, [unlockedFlash]);

  useWatchContractEvent({
    address: JACKPOT_ADDRESS,
    abi,
    eventName: 'JackpotLocked',
    onLogs: refetchAll,
    poll: true,
  });
  useWatchContractEvent({
    address: JACKPOT_ADDRESS,
    abi,
    eventName: 'JackpotSettled',
    onLogs: refetchAll,
    poll: true,
  });
  useWatchContractEvent({
    address: JACKPOT_ADDRESS,
    abi,
    eventName: 'NewDrawingInitialized',
    onLogs: refetchAll,
    poll: true,
  });
  useWatchContractEvent({
    address: JACKPOT_ADDRESS,
    abi,
    eventName: 'JackpotUnlocked',
    onLogs: () => {
      setUnlockedFlash(true);
      refetchAll();
    },
    poll: true,
  });

  const state = stateQuery.data as DrawingState | undefined;
  const phase: LifecyclePhase = unlockedFlash ? 'unlocked' : derivePhase(state);

  return {
    phase,
    state,
    drawingId,
    isLoading: stateQuery.isLoading || drawingIdQuery.isLoading,
    refetch: refetchAll,
  };
}
