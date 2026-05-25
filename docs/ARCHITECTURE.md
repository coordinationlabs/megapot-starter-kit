# Architecture

The kit splits reads between two sources and writes go on-chain. This doc
explains the API-vs-RPC division, polling cadence, and the design choices
that ripple across the codebase.

If you came here from the README and want the rebrand checklist, jump to
[`CUSTOMIZE.md`](./CUSTOMIZE.md) instead.

## API vs RPC matrix

The canonical table. Every read in `src/hooks/` resolves to one of these
rows; if a fork adds a new hook, decide which column it belongs in before
writing code.

| Read type | Source | Why |
|---|---|---|
| Live drawing state (jackpot lock, time, ball bounds) | RPC | Sub-block latency matters. UI status flips on `JackpotLocked` / `JackpotSettled` events. |
| Per-drawing prize-tier projection | RPC | The Data API only populates `prize_tiers` after settlement; pre-settle projections come from `getExpectedDrawingTierPayouts`. |
| Real-time post-buy confirmation | RPC | The Data API is eventually consistent (indexer lag); the buy page needs to confirm tickets exist before navigating away. |
| Wallet ticket / win / round historical aggregates | Data API | One paginated call vs. N RPC reads + manual decode. |
| Wallet lifetime stats | Data API | The indexer pre-computes lifetime tickets, wins, spend, referral earnings. |
| Round listing with aggregates | Data API | A single `/rounds` call returns 50 rounds with `prize_pool`, `lp_earnings`, `winning_numbers`, `prize_tiers` already folded in. |
| Writes (buy, claim, lp, subscribe) | RPC | Always on-chain. |

Files: see `src/hooks/useJackpotState.ts`, `src/hooks/useUserTickets.ts`,
`src/hooks/usePrizeTiers.ts` for RPC reads; `src/hooks/useRound.ts`,
`src/hooks/useRoundsList.ts`, `src/hooks/useWalletStats.ts`,
`src/hooks/useWalletTickets.ts`, `src/hooks/useWalletWins.ts` for Data API
reads. The Data API client + types live in `src/lib/api.ts`.

## Polling cadence

The kit avoids manual refresh buttons in favor of a hybrid pattern:
phase-aware polling + event subscriptions for instant transitions.

`src/hooks/useJackpotState.ts` polls `getDrawingState` on this cadence:

| Phase | Interval | Why |
|---|---|---|
| `open` | 30 s | Only ticket counts move; users won't notice a 30 s lag on a 24 h drawing. |
| `awaiting` | 5 s | Countdown crossed `drawingTime`; anyone can call `runJackpot()` at any second. |
| `settling` | 5 s | Pyth entropy callback fires 1–2 blocks after `JackpotLocked`; sometimes ~30 s. |
| `settled` | off | Settled state is immutable — re-polling is wasted bandwidth. |

The interval is set as a function inside `refetchInterval` so the cadence
adapts the moment the phase changes, not at the next mount.

In parallel, four event subscriptions on the Jackpot contract
(`JackpotLocked`, `JackpotSettled`, `NewDrawingInitialized`,
`JackpotUnlocked`) call `refetchAll()` for instant refresh — closing the
gap any polling interval would leave.

`useRound.ts` follows the same idea on the Data API side: settled rounds
get `staleTime: Infinity` because they never change.

## Invalidation graph

Writes invalidate the matching read keys; events from other writers do
the same. Every key lives in `QK` constants in `src/lib/api.ts` so the
invalidation site can't drift from the hook's query key.

| Trigger | Invalidates | Source |
|---|---|---|
| Buy confirms (`useBuyTickets`, `useBulkPurchase`, `useSubscribe`) | `QK.walletTicketsByRound`, `QK.walletTickets`, `QK.walletStats`, `QK.walletWins` | `src/pages/Play.tsx` |
| `BatchOrderExecuted` event | Same four keys as buy confirm (chunked bulk orders mint tickets over time) | `src/hooks/useBulkPurchase.ts` |
| `JackpotSettled` event | `QK.rounds` (round list aggregates change at settlement) | `src/hooks/useRoundsList.ts` |
| `JackpotLocked` / `JackpotSettled` / `NewDrawingInitialized` / `JackpotUnlocked` | `useJackpotState` refetches in-place | `src/hooks/useJackpotState.ts` |

The pattern is verbatim across the kit: every write path that mutates
indexer-tracked state invalidates the matching Data API keys; every
phase-changing on-chain event refetches its RPC reader. A fork that adds
a new write (e.g. a custom claim flow) follows the same shape — call
`queryClient.invalidateQueries({ queryKey: [QK.NS, API_BASE_URL, <resource>] })`
inside the success effect.

## Three-tier API key handling

The Data API supports three deployment shapes; all three live as
documented options in [`.env.example`](../.env.example). Pick once
per fork:

- **Anonymous (default).** No key. Browser hits `api.megapot.io`
  directly. Anonymous tier: 10 requests/minute, 500/day.
- **Browser key.** Set `VITE_MEGAPOT_API_KEY`. Higher tier:
  60/minute, 10K/day. Key ships in the browser bundle — acceptable for
  the read-only Data API, rotate via the dashboard if leaked.
- **Proxy.** Set `MEGAPOT_API_KEY` (server-side only, no `VITE_`
  prefix) and `VITE_API_BASE_URL=/api/megapot`. Deploy
  [`server/proxy.ts`](../server/proxy.ts) — a framework-agnostic Hono
  proxy. See [`examples/README.md`](../examples/README.md) for the
  Vercel Functions and Cloudflare Workers wrappers.

The kit detects `mpk_dev_*` keys in production builds and warns at
boot (`src/lib/api.ts`), so a forker doesn't chase a 403 chain.

## Decisions worth knowing

These are choices that ripple beyond their immediate file. Linked from
[`CUSTOMIZE.md`](./CUSTOMIZE.md) at the relevant rebrand steps.

### RainbowKit (not ConnectKit, not vanilla wagmi)

Zero-config WalletConnect modal + injected wallet detection in ~5 lines
of provider setup. The kit treats the wallet provider as a swappable
boundary — `src/config/wagmi.ts` and the `<RainbowKitProvider>` wrapper
in `src/main.tsx` are the only two files that know about RainbowKit.
Everything downstream uses wagmi's hooks (`useAccount`, `useReadContract`,
`useWriteContract`, `useWatchContractEvent`) which are vendor-neutral.

Swap path is documented in `CUSTOMIZE.md` § "Wallet provider".

### `useState` tab routing (not TanStack Router)

5 pages, no deep-link requirement. A router would add a dependency
and force every page to think about URL state; tab state in `App.tsx`
keeps the dependency graph one file shallower. If a fork later needs
URL state, swapping to TanStack Router or React Router is a one-file
change — each page is self-contained, so deletion stays cheap.

### Exact-allowance approvals (not `maxUint256`)

`<ApprovalButton>` (`src/components/common/ApprovalButton.tsx`) approves
the exact amount per purchase. Smaller blast radius if any of the four
spenders (Jackpot, BatchPurchaseFacilitator, JackpotAutoSubscription,
JackpotLPManager) is ever compromised — the attacker drains today's
purchase, not the user's lifetime USDC balance.

Forks that want approve-once UX swap one line — the JSDoc on
`ApprovalButton` calls this out explicitly.

### No UI library — Tailwind only

Keeps the dependency graph shallow. `<Button>` (3 variants) +
`brand.primary` Tailwind tokens + a handful of inline-SVG icons cover
every action surface. A rebrand is a `tailwind.config.ts` color-scale
edit + `BrandMark.tsx` logo swap; no Radix / shadcn / Headless UI to
unwind.

### `bigint` everywhere for amounts

USDC raw 6-decimal units stay as `bigint` from contract read through
display formatter. `BigInt.prototype.toJSON` is polyfilled in
`src/main.tsx` for accidental JSON.stringify calls; wagmi's `hashFn`
(also wired in `src/main.tsx`) handles bigints inside TanStack Query
keys. Together: nothing in the React tree blows up on bigint
serialization, and amounts never round-trip through floating point.

### Data API + RPC, not just RPC

Round listing on a forkable starter (no indexer of its own) would
otherwise require ~50 backward-walking multicall pages on every
History tab open. The Data API gives forks pre-computed round
aggregates for free, so wallet aggregates, round listings, and ticket
history come from the API while live state and writes stay on RPC.

## See also

- [`CUSTOMIZE.md`](./CUSTOMIZE.md) — every rebrand seam in one place
- [`../examples/README.md`](../examples/README.md) — proxy deploy wrappers
- [`../AGENTS.md`](../AGENTS.md) — JSDoc convention used in every src file
- [`https://llms.megapot.io`](https://llms.megapot.io) — protocol-side skills
