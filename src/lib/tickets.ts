/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 * @customize  Pure functions: ticket randomization, route selection, cost calc.
 *             Edit MAX_CUSTOM_TICKETS, MAX_QTY_ONE_TIME, MAX_DAYS_SUBSCRIPTION
 *             to change UI caps. Routing thresholds match the protocol's
 *             `Jackpot.buyTickets` <=10 limit.
 * ---
 */
import { BONUSBALL_MIN } from '@/config/contracts';

/** UI cap on user-entered custom tickets, per the buy-bulk skill recommendation. */
export const MAX_CUSTOM_TICKETS = 10;
/** UI cap on a single one-time purchase. */
export const MAX_QTY_ONE_TIME = 50;
/** UI cap on subscription duration in drawings. Devs can raise. */
export const MAX_DAYS_SUBSCRIPTION = 30;
/** Threshold above which the bulk facilitator is required (per buy-bulk skill). */
export const BULK_THRESHOLD = 10;

/**
 * Hard cap on tickets per `Jackpot.claimWinnings` call. Above ~50, the
 * batched claim approaches block gas limit (per `claim-winnings` SKILL).
 * UI surfaces this cap when a round has more unclaimed wins than fit
 * in one tx; the user claims in chunks.
 */
export const MAX_CLAIM_BATCH = 50;

export type CustomTicket = { normals: number[]; bonusball: number };
export type PurchaseRoute = 'jackpot' | 'bulk' | 'subscribe';

/**
 * Pick the contract route based on purchase shape. Per the buy-bulk skill +
 * Jackpot.buyTickets's hard cap of 10 tickets per call:
 *
 *   recurring | count   | route       | reason
 *   --------- | ------- | ----------- | --------------------------------------
 *   true      | any     | subscribe   | JackpotAutoSubscription, one per addr
 *   false     | <= 10   | jackpot     | Jackpot.buyTickets (cheapest path)
 *   false     | > 10    | bulk        | BatchPurchaseFacilitator (multi-tx)
 *
 * Approval target follows the route — the kit's ApprovalButton reads
 * `route` and approves against the matching contract.
 */
export function pickPurchaseRoute(args: { count: number; recurring: boolean }): PurchaseRoute {
  if (args.recurring) return 'subscribe';
  if (args.count > BULK_THRESHOLD) return 'bulk';
  return 'jackpot';
}

/**
 * Total USDC cost for a purchase. Mirrors the protocol's cost formula:
 *   - one-time: ticketPriceUsdcRaw × count
 *   - subscribe: ticketPriceUsdcRaw × totalDays × ticketsPerDrawing
 *
 * @returns bigint in raw 6-decimal USDC units (multiply by 10**-6 for display).
 */
export function totalCost(args: {
  ticketPriceUsdcRaw: bigint;
  count: number;
  totalDays?: number;
}): bigint {
  const days = BigInt(args.totalDays ?? 1);
  return args.ticketPriceUsdcRaw * BigInt(args.count) * days;
}

/** Generate one random custom ticket — 5 unique normals + 1 bonusball. */
export function randomTicket(args: { ballMax: number; bonusballMax: number }): CustomTicket {
  const normals = new Set<number>();
  while (normals.size < 5) {
    normals.add(1 + Math.floor(Math.random() * args.ballMax));
  }
  const bonusball =
    BONUSBALL_MIN + Math.floor(Math.random() * (args.bonusballMax - BONUSBALL_MIN + 1));
  return { normals: [...normals].sort((a, b) => a - b), bonusball };
}

/** True iff the ticket has 5 unique normals in [1, ballMax] + a valid bonusball. */
export function isValidTicket(
  t: CustomTicket,
  bounds: { ballMax: number; bonusballMax: number },
): boolean {
  if (t.normals.length !== 5) return false;
  const unique = new Set(t.normals);
  if (unique.size !== 5) return false;
  for (const n of t.normals) {
    if (!Number.isInteger(n) || n < 1 || n > bounds.ballMax) return false;
  }
  if (
    !Number.isInteger(t.bonusball) ||
    t.bonusball < BONUSBALL_MIN ||
    t.bonusball > bounds.bonusballMax
  ) {
    return false;
  }
  return true;
}

/**
 * Count of normals the user matched against the winning numbers (for UI
 * highlighting). Tier ID is read from `Jackpot.getTicketTierIds` — do **not**
 * compute it here.
 */
export function matchOverlap(
  userNormals: readonly number[],
  winningNormals: readonly number[],
): number {
  const w = new Set(winningNormals);
  let matches = 0;
  for (const n of userNormals) if (w.has(n)) matches++;
  return matches;
}
