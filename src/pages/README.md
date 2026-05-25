# `src/pages/`

One top-level component per tab in the kit. Each page imports hooks +
components and orchestrates the user flow; reads happen in
`src/hooks/`, writes in the same hooks (TanStack Query mutation
wrappers).

| File | Tab | Primary data source |
|---|---|---|
| `Home.tsx` | Home | RPC (`useJackpotState`, `usePrizeTiers`) |
| `Play.tsx` | Play | RPC writes + USDC reads — invalidates Data API on confirm |
| `Tickets.tsx` | Tickets | Hybrid — Data API (`useWalletStats`, `useWalletWins`, `useUserTickets`) + RPC (`useJackpotState`) for active-round context |
| `LP.tsx` | LP | RPC (`useLpInfo`, `useJackpotState`, `useUsdcBalance`) |
| `History.tsx` | History | Data API (`useRoundsList`) |

Tab routing lives in [`../App.tsx`](../App.tsx) as `useState`. No router
dep — see [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
§ "`useState` tab routing" for the rationale and the swap path to
TanStack Router.

## See also

- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — API vs RPC matrix + invalidation graph
- [`../hooks/README.md`](../hooks/README.md) — every hook with its skill link
