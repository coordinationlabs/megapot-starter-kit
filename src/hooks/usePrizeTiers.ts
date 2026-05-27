/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 *             https://llms.megapot.io/tasks/claim-referral-fees
 * @contract   GuaranteedMinimumPayoutCalculator.getExpectedDrawingTierPayouts
 * @customize  RPC-side projected tier payouts for the LIVE current drawing
 *             (uses the active prize pool — answers "what would each tier
 *             pay if the drawing settled now?"). Returns the normalized
 *             `TierRow[]` the `<PrizeTiers />` component expects.
 *
 *             For settled past drawings, the API serves `Round.prize_tiers`
 *             with both projected payouts and the actual ticket counts —
 *             see `DrawingList.tsx` for the past-drawing tier breakdown.
 *             RPC stays here because the API only populates `prize_tiers`
 *             after settlement.
 *
 *             Tier formula: `tierId = normalMatches * 2 + (bonusball ? 1 : 0)`.
 *             Tiers 0 + 2 are losing rows (no bonusball at low matches).
 *
 *             Referral net math. `getExpectedDrawingTierPayouts` returns the
 *             GROSS tier payouts — the contract reserves
 *             `payout * referralWinShare / 1e18` for the buyer's referrer at
 *             claim time. Pass `referralWinShare` (1e18 scale) from
 *             `useJackpotState().state` to get the NET amount a winner
 *             actually receives. Omitting it returns the raw gross values
 *             (back-compat for any fork that wants the unadjusted contract
 *             numbers). See the `claim-referral-fees` skill for the formula
 *             and where the share goes.
 * ---
 */
import { useMemo } from 'react';
import { parseAbi } from 'viem';
import { useReadContract } from 'wagmi';
import type { TierRow } from '@/components/lottery/PrizeTiers';
import { PAYOUT_CALCULATOR_ADDRESS } from '@/config/contracts';

const abi = parseAbi([
  'function getExpectedDrawingTierPayouts(uint256 _drawingId, uint256 _prizePool, uint8 _normalMax, uint8 _bonusballMax) view returns (uint256[12] drawingTierPayouts)',
]);

/** Protocol bps denominator for `referralWinShare` and `referralFee`. */
const ONE_E18 = 1_000_000_000_000_000_000n;

export function usePrizeTiers(args: {
  drawingId: bigint | undefined;
  prizePool: bigint | undefined;
  ballMax: number | undefined;
  bonusballMax: number | undefined;
  /**
   * `Jackpot.getDrawingState().referralWinShare` (1e18 scale). When provided,
   * each tier's payout is reduced by `gross * referralWinShare / 1e18` so the
   * displayed amount matches what a winner actually receives.
   */
  referralWinShare?: bigint;
}) {
  const ready =
    args.drawingId !== undefined &&
    args.prizePool !== undefined &&
    args.ballMax !== undefined &&
    args.bonusballMax !== undefined;

  const query = useReadContract({
    address: PAYOUT_CALCULATOR_ADDRESS,
    abi,
    functionName: 'getExpectedDrawingTierPayouts',
    // biome-ignore lint/style/noNonNullAssertion: gated by `ready` check above; args is only constructed when all four are defined
    args: ready ? [args.drawingId!, args.prizePool!, args.ballMax!, args.bonusballMax!] : undefined,
    query: { enabled: ready },
  });

  const payouts = query.data as readonly bigint[] | undefined;
  const share = args.referralWinShare;
  const tiers: TierRow[] | undefined = useMemo(() => {
    if (!payouts) return undefined;
    return payouts.map((gross, tierId) => {
      const payout = share !== undefined ? (gross * (ONE_E18 - share)) / ONE_E18 : gross;
      return { tierId, payout };
    });
  }, [payouts, share]);

  return {
    tiers,
    isLoading: query.isLoading,
  };
}
