# `src/components/`

UI primitives + composite sections. Grouped by surface; each
subdirectory is a logical layer. Every file carries a JSDoc header per
the convention in [`../../AGENTS.md`](../../AGENTS.md).

## Subdirectories

- **`common/`** — primitives reused across pages. `Button` (3-variant
  primitive — primary/secondary/danger), `ApprovalButton` (generic USDC
  approve, exact-allowance default), `CopyButton` (click-to-copy + 1s
  flash), `DataApiCredit` ("via Megapot Data API" link; single edit
  point for the attribution surfaced on every API-backed section),
  `UsdcAmount` (raw-bigint formatter), `TxStatus`
  (pending/confirmed/failed pill).
- **`layout/`** — app shell. `Layout` (provider + Nav + Footer
  container), `Nav` (top tabs desktop / bottom tab bar mobile),
  `ProfileCard` (connect button + balance pill on `md+`),
  `MobileWalletBar` (sub-`md` sub-row in the sticky header — connect
  CTA when disconnected, address + ETH/USDC + Disconnect when
  connected), `Footer`, plus the rebrand seams `BrandMark` (logo SVG)
  and `DisclaimerLink` (legal link primitive).
- **`icons/`** — inline SVG icons, one file per icon. Zero external dep.
  Five nav icons (Home/Play/Tickets/Lp/History) plus Copy / Check /
  ExternalLink.
- **`lottery/`** — current-drawing surfaces. `PrizePool`, `Countdown`,
  `PrizeTiers`, `LifecycleStatus`. Plus buy-side composites:
  `TicketBuilder` (number entry + qty slider + custom-pin),
  `SubscriptionToggle`, `BulkProgress` (chunked bulk-buy progress).
- **`tickets/`** — wallet + ticket history surfaces. `WalletStatsCard`
  (Data API lifetime aggregate), `CurrentDrawingTickets`, `TicketCard`
  (numbers + match status), `ActiveSubscription`, `UnclaimedWins` (wins
  to claim, per-row claim inlined), `PastRoundTickets` (round-detail
  ticket listing), `ClaimReferralFees` (operator earnings).
- **`lp/`** — LP page surfaces. `PoolStatus` (Open/Closed badge +
  capacity hint), `DepositForm`, `WithdrawTwoStep` (initiate → finalize
  flow with locked-drawing banner).
- **`history/`** — history page surfaces. `DrawingList` — paginated
  rounds with expanded-row detail (the originally spec'd `DrawingDetail`
  is inlined here as the row-expansion content).

## See also

- [`../../docs/CUSTOMIZE.md`](../../docs/CUSTOMIZE.md) — `BrandMark`,
  `Button`, `DisclaimerLink`, copy strings are documented as rebrand
  seams here
- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — UI library
  choice (Tailwind-only) rationale
- [`../../AGENTS.md`](../../AGENTS.md) — JSDoc convention
