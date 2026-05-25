# `src/hooks/`

TanStack Query wrappers — one hook per discrete read/write. Every file
carries an `@skill` link to the protocol-side documentation on
[`llms.megapot.io`](https://llms.megapot.io).

API vs RPC split rationale: [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
§ "API vs RPC matrix".

## RPC reads (wagmi `useReadContract`)

- `useJackpotState.ts` — hybrid lifecycle reader (poll + 4 event subs) — [`read-state`](https://llms.megapot.io/tasks/read-state)
- `usePrizeTiers.ts` — pre-settlement tier projections — [`read-state`](https://llms.megapot.io/tasks/read-state)
- `useUsdcBalance.ts` — ERC-20 balanceOf — [`read-state`](https://llms.megapot.io/tasks/read-state)
- `useUsdcAllowance.ts` — ERC-20 allowance (driver for `<ApprovalButton>`) — [`buy-tickets`](https://llms.megapot.io/tasks/buy-tickets)
- `useLpInfo.ts` — LP pool state, cap, drawing-state — [`lp-deposit`](https://llms.megapot.io/tasks/lp-deposit)

## RPC writes (wagmi `useWriteContract`)

- `useBuyTickets.ts` — `Jackpot.buyTickets` (≤10 path) — [`buy-tickets`](https://llms.megapot.io/tasks/buy-tickets)
- `useBulkPurchase.ts` — `BatchPurchaseFacilitator` + `BatchOrderExecuted` polling — [`buy-bulk`](https://llms.megapot.io/tasks/buy-bulk)
- `useSubscribe.ts` — `JackpotAutoSubscription` create / cancel / status — [`subscribe`](https://llms.megapot.io/tasks/subscribe)
- `useClaimWinnings.ts` — `Jackpot.claimWinnings` batched per round — [`claim-winnings`](https://llms.megapot.io/tasks/claim-winnings)
- `useClaimReferralFees.ts` — operator's accumulated fees — [`claim-referral-fees`](https://llms.megapot.io/tasks/claim-referral-fees)
- `useLpDeposit.ts` — USDC approve + `lpDeposit` — [`lp-deposit`](https://llms.megapot.io/tasks/lp-deposit)
- `useLpWithdraw.ts` — two-step `initiateWithdraw` → `finalizeWithdraw` — [`lp-withdraw`](https://llms.megapot.io/tasks/lp-withdraw)

## Data API reads (`api.megapot.io/v1`)

Backed by the typed client in [`src/lib/api.ts`](../lib/api.ts). All five
hooks use `QK` query-key constants so invalidation sites can't drift.

- `useActiveRound.ts` — aggregates for the live round (ticket_count, unique_participants, lp_earnings) on a 30s refetch
- `useRound.ts` — single-round detail (settled rounds get `staleTime: Infinity`)
- `useRoundsList.ts` — paginated rounds list, invalidates on `JackpotSettled`
- `useUserTickets.ts` — wallet tickets for one round (current OR past)
- `useWalletStats.ts` — lifetime aggregate (tickets, wins, spend, referral)
- `useWalletTickets.ts` — wallet ticket history (cross-round)
- `useWalletWins.ts` — wallet wins with `claimed` filter

All carry [`data-api`](https://llms.megapot.io/data-api) as their `@skill`.

## See also

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — polling cadence + invalidation graph
- [`../../docs/CUSTOMIZE.md`](../../docs/CUSTOMIZE.md) — rebrand seams
- [`../../AGENTS.md`](../../AGENTS.md) — JSDoc convention
