/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 * @contract   Jackpot.buyTickets
 * @customize  Path for ≤10 tickets (custom + auto-random + mixed). For 11+
 *             use useBulkPurchase. Approval target = JACKPOT_ADDRESS.
 *
 *             No on-chain quick-pick: the Jackpot contract requires every
 *             ticket to carry exactly 5 normals + a non-zero bonusball, or
 *             it reverts with `InvalidNormalsCount` / `InvalidBonusball`.
 *             Auto-random tickets are generated client-side via
 *             `randomTicket()` in `lib/tickets.ts` — the caller passes the
 *             active drawing's `ballMax` + `bonusballMax` so the generator
 *             produces values in the contract-accepted range.
 * ---
 */
import { parseAbi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  JACKPOT_ADDRESS,
  REFERRER_ADDRESS,
  REFERRAL_SPLIT_FULL,
  TICKET_SOURCE,
} from '@/config/contracts';
import { type CustomTicket, randomTicket } from '@/lib/tickets';

const abi = parseAbi([
  'function buyTickets((uint8[] normals, uint8 bonusball)[] _tickets, address _recipient, address[] _referrers, uint256[] _referralSplit, bytes32 _source) returns (uint256[] ticketIds)',
]);

export function useBuyTickets() {
  const { address } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });

  /**
   * Mixed call: any combination of caller-supplied custom tickets +
   * client-generated random tickets (the contract has no on-chain
   * quick-pick — see the file header).
   */
  const buy = (args: {
    customTickets: CustomTicket[];
    randomCount: number;
    ballMax: number;
    bonusballMax: number;
  }) => {
    if (!address) return;
    const tickets = [
      ...args.customTickets.map((t) => ({
        normals: t.normals,
        bonusball: t.bonusball,
      })),
      ...Array.from({ length: args.randomCount }, () =>
        randomTicket({ ballMax: args.ballMax, bonusballMax: args.bonusballMax }),
      ),
    ];
    write.writeContract({
      address: JACKPOT_ADDRESS,
      abi,
      functionName: 'buyTickets',
      args: [tickets, address, [REFERRER_ADDRESS], [...REFERRAL_SPLIT_FULL], TICKET_SOURCE],
    });
  };

  return {
    buy,
    txHash: write.data,
    isWaitingSignature: write.isPending,
    isMining: receipt.isLoading,
    /** Combined "in-flight" flag. Kept for callers that only need a single bool. */
    isPending: write.isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: write.error ?? receipt.error,
    reset: write.reset,
  };
}
