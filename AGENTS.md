# AGENTS guide

Every file in `src/` has a JSDoc header block following the kit's
`@skill / @contract / @endpoint / @customize` convention. Read it first;
you'll know what the file does, what protocol surface it touches, and
what's expected to be edited on a fork.

If you want a flat file → purpose manifest to grep against, use
[`llms.txt`](./llms.txt). If you want the architecture layer (API/RPC
division, polling cadence, decisions), use
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md). If you want the rebrand
checklist, use [`docs/CUSTOMIZE.md`](./docs/CUSTOMIZE.md).

## Branches

Two long-lived branches, kept at **feature parity except for on-chain writes
and wallet connection**:

- **`main`** — the public fork/clone branch; the general-use white-label kit.
- **`demo`** — deployed to demo.megapot.io. A **read-only showcase**: every
  on-chain *write* is disabled (ticket buys, win/referral claims, LP
  deposit/withdraw) via a custom wagmi connector
  (`src/config/demoConnector.ts` → `DEMO_MODE`; the connector throws on write
  RPCs). A single showcase wallet auto-connects (`VITE_DEMO_ADDRESS`, with a
  baked-in default). `LP_ENABLED` is `true` here (vs. `false` on `main`).

**Parity rule:** every general change lands on `main` first, then ports to
`demo` (merge `main` → `demo`). Demo-only changes — the read-only showcase, the
demo wallet, write-disabling — live only on `demo`.

## The convention

```
/**
 * ---
 * @skill      https://llms.megapot.io/tasks/<skill-name>
 * @contract   <Contract>.<function>      (if the file touches a contract)
 * @endpoint   GET /v1/<endpoint>          (if the file touches the Data API)
 * @customize  <one-paragraph: what this file is for + what's expected to
 *              be edited>
 * ---
 *
 * <free-form explanation, usually 2-5 paragraphs>
 */
```

The block lives at the top of every hook, component, config, and lib
file in `src/`. The `---` fence is decorative — it marks the metadata
section visually so a reader (human or agent) sees the structure at a
glance.

## What each tag means

- **`@skill`** — link to the canonical skill on
  [`llms.megapot.io`](https://llms.megapot.io). That's where the
  protocol-side semantics live (calldata layout, return shape, gas
  considerations, edge cases). The kit is the implementation pattern;
  the skill is the protocol behavior. Read the skill end-to-end if
  the kit's approach surprises you.
- **`@contract`** — names the on-chain function the file calls.
  Example: `Jackpot.buyTickets`, `BatchPurchaseFacilitator.createBatchOrder`,
  `JackpotLPManager.lpDeposit`. The contract reference index lives at
  [`llms.megapot.io/contracts/reference`](https://llms.megapot.io/contracts/reference).
- **`@endpoint`** — names the Data API endpoint the file consumes.
  Example: `GET /v1/rounds`, `GET /v1/wallets/{address}/stats`. Full
  OpenAPI surface at [api.megapot.io/v1/docs](https://api.megapot.io/v1/docs).
- **`@customize`** — the section a forker reads first. Describes what's
  expected to change vs. stay stable. If a file is a rebrand seam (logo,
  copy, brand color, allowance strategy, etc.), this tag explains how to
  swap it without ripple effects.

A file can have any subset of these — components without a contract or
endpoint just carry `@skill` (when relevant) and `@customize`. Pure
primitives (`<Button>`, `<UsdcAmount>`) carry only `@customize`.

## Where to start by goal

- **"I want to fork + rebrand"** → [`docs/CUSTOMIZE.md`](./docs/CUSTOMIZE.md).
  Nine ordered sections, each linking to a file you'd touch.
- **"I want to understand the architecture"** →
  [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md). API vs RPC matrix,
  polling cadence, invalidation graph, decisions.
- **"I want to add a feature"** → read the closest existing hook + page
  (e.g. for a new ticket-purchase variant, start in
  `src/hooks/useBuyTickets.ts` and `src/pages/Play.tsx`). Follow the
  JSDoc convention + structure on anything new you write.
- **"I want to navigate by file purpose"** → [`llms.txt`](./llms.txt).
  Flat list, grep-friendly.
- **"I want to understand the protocol, not the kit"** →
  [`llms.megapot.io`](https://llms.megapot.io). Skills + recipes +
  contracts reference. The kit is one implementation of those skills.

## Live skills

The kit is *implementation*; toolkit skills at
[`llms.megapot.io`](https://llms.megapot.io) are *protocol*. When a
`@skill` link appears in a file header, treat the linked skill as the
source of truth for protocol-side behavior — the kit is the canonical
implementation pattern, but never a substitute for reading the
underlying skill.

Notable skills referenced from the kit:

- [`tasks/react-setup`](https://llms.megapot.io/tasks/react-setup) — wagmi + RainbowKit + provider order
- [`tasks/read-state`](https://llms.megapot.io/tasks/read-state) — lifecycle phases + event signatures
- [`tasks/buy-tickets`](https://llms.megapot.io/tasks/buy-tickets) — Jackpot.buyTickets calldata + decision matrix
- [`tasks/buy-bulk`](https://llms.megapot.io/tasks/buy-bulk) — BatchPurchaseFacilitator + multi-tx fulfillment
- [`tasks/subscribe`](https://llms.megapot.io/tasks/subscribe) — JackpotAutoSubscription + refund semantics
- [`tasks/claim-winnings`](https://llms.megapot.io/tasks/claim-winnings) — batched claim + MAX_CLAIM_BATCH
- [`tasks/claim-referral-fees`](https://llms.megapot.io/tasks/claim-referral-fees) — operator earnings claim
- [`data-api`](https://llms.megapot.io/data-api) — typed REST client + retry recipe
- [`contracts/reference`](https://llms.megapot.io/contracts/reference) — every contract address + ABI

## See also

- [`README.md`](./README.md) — fork-in-5 + env + deploy
- [`llms.txt`](./llms.txt) — file manifest
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — design layer
- [`docs/CUSTOMIZE.md`](./docs/CUSTOMIZE.md) — rebrand checklist
