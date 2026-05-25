/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @docs       https://api.megapot.io/v1/docs
 * @openapi    https://api.megapot.io/v1/openapi.json (target version 1.5.0)
 * @customize  Single typed REST client for the Megapot Data API. Read-only.
 *
 *             Read-side divide (per the live skill matrix):
 *               • All wallet ticket / win / round reads → this client
 *               • Live drawing state (jackpot lock, time, ball bounds) → RPC
 *               • Real-time post-buy confirmation (sub-block latency) → RPC
 *               • Writes (buy, claim, lp, subscribe) → RPC
 *
 *             Round (v1.2.0+) carries `winning_numbers`, `prize_tiers`, and
 *             `ball_pool` so the History page is one paginated call — no
 *             RPC fallback needed. v1.3.0 added `lp_earnings`; v1.5.0
 *             tightened it to non-null so any LP-yield UI lives on the
 *             API too.
 *
 *             Endpoint coverage. The `api` object below mirrors all 10 v1
 *             endpoints; the starter kit consumes 4 of them via dedicated
 *             hooks (`walletStats`, `walletWins`, `walletTicketsForRound`,
 *             `listRounds`). The other 6 (`activeRound`, `round`,
 *             `roundTickets`, `roundWins`, `walletTickets`,
 *             `walletWinsForRound`) are typed and ready for forks that need
 *             round-leaderboards, single-round detail, or cross-drawing
 *             wallet feeds without re-deriving the URL or response shape.
 *
 *             API key (`VITE_MEGAPOT_API_KEY`) is optional — without one, the
 *             request falls back to the anonymous tier (10/min, 500/day).
 *             With a key: 60/min, 10K/day. Mint one from
 *             https://megapot.io/dashboard. Because Vite SPAs ship env to
 *             the browser, treat the key as semi-public and rotate via the
 *             dashboard if it leaks. For a privileged server-side key,
 *             proxy the API through your own backend instead of fetching
 *             directly.
 * ---
 */

/**
 * Base URL for v1 of the Megapot Data API.
 *
 * Override via `VITE_API_BASE_URL` to switch tiers:
 *   1. Anonymous (default): leave unset. Browser hits `api.megapot.io`
 *      directly, anonymous tier (10/min, 500/day).
 *   2. Browser key: set `VITE_MEGAPOT_API_KEY`. Same default base URL,
 *      higher tier (60/min, 10K/day). Key ships to the browser bundle.
 *   3. Proxy: set `VITE_API_BASE_URL=/api/megapot` AND deploy
 *      `server/proxy.ts` with `MEGAPOT_API_KEY` (no VITE_ prefix) on
 *      the server side. The key never reaches the browser. See
 *      `examples/` for platform-specific deploy wrappers.
 *
 * Empty / whitespace-only env values fall back to the default URL.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'https://api.megapot.io/v1';

/**
 * Centralized TanStack Query key prefixes for every Data API resource.
 * Use these instead of magic strings so an invalidation site can't
 * silently drift from a hook's key.
 *
 * Convention: `[QK.NS, API_BASE_URL, QK.resource, ...args]` where
 * `QK.NS = 'megapot-api'` namespaces the whole API client, and
 * `QK.resource` identifies which endpoint family.
 */
export const QK = {
  NS: 'megapot-api',
  walletStats: 'wallet-stats',
  walletWins: 'wallet-wins',
  walletTickets: 'wallet-tickets',
  walletTicketsByRound: 'wallet-tickets-round',
  rounds: 'rounds',
  round: 'round',
} as const;

/** Optional bearer key. When undefined, requests fall back to the anonymous tier. */
const API_KEY = import.meta.env.VITE_MEGAPOT_API_KEY as string | undefined;

// `mpk_dev_*` keys target a separate environment from `mpk_live_*`; sending the
// wrong tier returns `403 key_environment_mismatch`. Surface the mismatch at
// boot so a forker doesn't chase a config bug through a 403 chain.
if (import.meta.env.PROD && API_KEY?.startsWith('mpk_dev_')) {
  // biome-ignore lint/suspicious/noConsole: deliberate diagnostic
  console.warn(
    '[megapot-api] VITE_MEGAPOT_API_KEY is a `mpk_dev_*` key in a production build — requests will 403 with `key_environment_mismatch`.',
  );
}

// ─── Types — hand-mirrored from OpenAPI v1.5.0 ──────────────────────────────
// Keep in sync with https://api.megapot.io/v1/openapi.json. Every type below
// is `export`ed so a fork can re-use the shapes without re-deriving them —
// many are not directly referenced inside this file but are part of the
// public surface (e.g. `Page<T>` returns from any list endpoint).

/** USDC amount in raw smallest-unit form. Divide by 10**decimals for display. */
export type Amount = { amount: string; decimals: number };

/** ISO 8601 UTC timestamp with millisecond precision (e.g. `2026-04-29T12:34:56.000Z`). */
export type Timestamp = string;

/** EVM address (EIP-55 checksum on output). */
export type ApiAddress = `0x${string}`;

/** EVM tx hash (32 bytes, 0x-prefixed). */
export type ApiTxHash = `0x${string}`;

/** Round identifier (stringified `drawing_id`). */
export type RoundId = string;

/**
 * Lifecycle state of a round.
 * - `active` — selling tickets OR drawing in progress (DB `open` + `locked`)
 * - `settled` — payouts done (DB `settled`)
 */
export type RoundStatus = 'active' | 'settled';

/** Contract-configured ranges for one round's normal / bonus pools. */
export type BallPool = { normals_max: number; bonusball_max: number };

/** The 5 normal numbers + 1 bonusball drawn at settlement. */
export type WinningNumbers = { normals: number[]; bonusball: number };

/**
 * One of 12 prize tiers for a settled round. `tier_id = normal_matches * 2 +
 * (bonusball_match ? 1 : 0)`. Tiers 0 and 2 are zero-payout (no bonus at low
 * matches) but `ticket_count` is still populated for tickets that landed
 * there — gives the full tier distribution, not just winners. `payout` is
 * the contract's gross per-ticket amount before the round's referral share.
 */
export type PrizeTier = {
  tier_id: number;
  normal_matches: number;
  bonusball_match: boolean;
  payout: Amount;
  ticket_count: number;
};

/** A round of the lottery, with per-round aggregates folded in. */
export type Round = {
  id: RoundId;
  status: RoundStatus;
  prize_pool: Amount;
  ticket_count: number;
  unique_participants: number;
  winners_count: number;
  /** Top prize amount; null until the round is drawn with at least one winner. */
  top_prize_amount: Amount | null;
  top_prize_winners_count: number;
  /**
   * Per-round LP yield (gross). Always populated — `{amount: "0", …}` while
   * the round is open and accumulates as tickets sell, finalized at
   * settlement. Tightened to non-null in OpenAPI v1.5.0.
   */
  lp_earnings: Amount;
  /** Derived from the previous round's `settled_at` (null for round 1). */
  started_at: Timestamp | null;
  /** Contract `drawingTime`. */
  ended_at: Timestamp | null;
  /** Wall-clock settlement time. Null until settled. */
  settled_at: Timestamp | null;
  /** Always populated, even on the active round (set when the round opens). */
  ball_pool: BallPool;
  /** Null until the round is drawn. */
  winning_numbers: WinningNumbers | null;
  /** 12-element array sorted ascending by `tier_id`. Null until settled. */
  prize_tiers: PrizeTier[] | null;
};

/**
 * A single ticket bought against a round. The drawn-only fields
 * (`matched_normals`, `bonusball_match`, `winnings_amount`) are null until the
 * round is settled.
 *
 * `wallet` is the recipient (owner). `buyer` is the address that submitted the
 * purchase — they may differ for gifted/agent buys.
 *
 * `user_ticket_id` is the on-chain `ticketId` you'd pass to `claimWinnings`.
 */
export type Ticket = {
  id: string;
  wallet: ApiAddress;
  buyer: ApiAddress;
  round_id: RoundId;
  user_ticket_id: string;
  normals: number[];
  bonusball: number;
  matched_normals: number | null;
  bonusball_match: boolean | null;
  winnings_amount: Amount | null;
  claimed: boolean;
  claimed_tx_hash: ApiTxHash | null;
  tx_hash: ApiTxHash;
  block_number: number;
  created_at: Timestamp;
};

/**
 * A winning ticket. Same shape as `Ticket` but `winnings_amount` is renamed
 * `amount` and the three drawn fields are guaranteed non-null. `claimed_tx_hash`
 * stays nullable — a Win can be unclaimed.
 */
export type Win = {
  id: string;
  wallet: ApiAddress;
  buyer: ApiAddress;
  round_id: RoundId;
  user_ticket_id: string;
  normals: number[];
  bonusball: number;
  matched_normals: number;
  bonusball_match: boolean;
  amount: Amount;
  claimed: boolean;
  claimed_tx_hash: ApiTxHash | null;
  tx_hash: ApiTxHash;
  block_number: number;
  created_at: Timestamp;
};

/** Aggregate ticket and winnings stats for a wallet. */
export type WalletStats = {
  address: ApiAddress;
  total_tickets: number;
  total_wins: number;
  total_winnings: Amount;
  total_spent: Amount;
  /** Lifetime referral fees attributed to this wallet (gross of any claims). */
  total_referral_earnings: Amount;
  rounds_played: number;
  first_seen_at: Timestamp | null;
  last_seen_at: Timestamp | null;
};

/** Cursor-paginated envelope. `next_cursor` is opaque base64url — don't construct it. */
export type Page<T> = {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
};

/** Standard error envelope thrown as `ApiError` on non-2xx responses. */
export type ApiErrorBody = {
  error: { code: string; message: string; request_id: string };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  /** Seconds to wait before retrying — present on 429s and some 503s. */
  readonly retryAfter: number | undefined;
  constructor(status: number, body: ApiErrorBody, retryAfter?: number) {
    super(`${status} ${body.error.code}: ${body.error.message}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error.code;
    this.requestId = body.error.request_id;
    this.retryAfter = retryAfter;
  }
}

/**
 * Default TanStack Query retry options for Data API queries. Threads the
 * server's `Retry-After` header (in seconds) into the retry-delay so a 429
 * waits exactly as long as the server asked, and only retries the
 * recoverable codes (`rate_limited` + `upstream_unavailable`). 4xx auth /
 * shape errors fail fast.
 *
 * Drop into `useQuery({ ...apiQueryRetry, queryKey, queryFn })`.
 *
 * @see https://llms.megapot.io/data-api § Recipes — TanStack Query retry
 */
export const apiQueryRetry = {
  retry: (failureCount: number, error: unknown) =>
    error instanceof ApiError &&
    (error.code === 'rate_limited' || error.code === 'upstream_unavailable') &&
    failureCount < 3,
  retryDelay: (failureCount: number, error: unknown) =>
    error instanceof ApiError && error.retryAfter
      ? error.retryAfter * 1000
      : Math.min(60_000, 1000 * 2 ** failureCount),
} as const;

/**
 * Friendly one-line summary for UI surfaces. Distinguishes the cases a user
 * can act on (rate-limit, transient upstream) from generic failures.
 */
export function formatApiError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'rate_limited':
        return e.retryAfter
          ? `Rate limit hit — retrying in ${e.retryAfter}s.`
          : 'Rate limit hit. Try again in a moment.';
      case 'upstream_unavailable':
        return 'Upstream temporarily unavailable. Retrying…';
      case 'invalid_api_key':
      case 'revoked_api_key':
      case 'key_environment_mismatch':
        return 'API key rejected. Check VITE_MEGAPOT_API_KEY.';
      default:
        return e.message;
    }
  }
  return e instanceof Error ? e.message : 'Request failed.';
}

// ─── Internals ───────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  return headers;
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, { headers: authHeaders(), signal: options?.signal });
  if (!res.ok) {
    // Pull the request id and retry-after from headers regardless of body
    // shape — a 5xx with a non-JSON body shouldn't strip them.
    const requestId = res.headers.get('x-request-id') ?? '';
    const retryAfterHeader = res.headers.get('retry-after');
    const retryAfter = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10) || undefined
      : undefined;

    let body: ApiErrorBody;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = {
        error: {
          code: 'unknown',
          message: res.statusText,
          request_id: requestId,
        },
      };
    }
    throw new ApiError(res.status, body, retryAfter);
  }
  const data = (await res.json()) as T;
  if (data === null || typeof data !== 'object') {
    throw new ApiError(res.status, {
      error: {
        code: 'malformed_response',
        message: 'Server returned a non-object body.',
        request_id: res.headers.get('x-request-id') ?? '',
      },
    });
  }
  return data;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * Complete v1 endpoint surface — most are unused by the starter kit but kept
 * in place so a fork that wants e.g. round-leaderboards or per-round wallet
 * tickets can call them without re-deriving the URL or response type.
 */
/**
 * Per-call options accepted by every endpoint. TanStack Query passes an
 * `AbortSignal` into `queryFn` for cancellation — thread it here to cancel
 * in-flight requests on unmount or rapid refetch.
 */
export type ApiCallOptions = {
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
};

export const api = {
  /** `GET /v1/rounds` — paginated rounds, newest first. */
  listRounds: (opts?: ApiCallOptions) =>
    get<Page<Round>>(
      '/rounds',
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),

  /** `GET /v1/rounds/active` — current open or drawing round. */
  activeRound: (opts?: { signal?: AbortSignal }) =>
    get<Round>('/rounds/active', undefined, { signal: opts?.signal }),

  /** `GET /v1/rounds/{roundId}` — single round + aggregates. */
  round: (roundId: string | bigint, opts?: { signal?: AbortSignal }) =>
    get<Round>(`/rounds/${roundId}`, undefined, { signal: opts?.signal }),

  /** `GET /v1/rounds/{roundId}/tickets` — paginated tickets in a round. */
  roundTickets: (roundId: string | bigint, opts?: ApiCallOptions) =>
    get<Page<Ticket>>(
      `/rounds/${roundId}/tickets`,
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),

  /** `GET /v1/rounds/{roundId}/wins` — paginated wins, sorted by amount desc. */
  roundWins: (roundId: string | bigint, opts?: ApiCallOptions) =>
    get<Page<Win>>(
      `/rounds/${roundId}/wins`,
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),

  /** `GET /v1/wallets/{address}/stats` — lifetime aggregate. */
  walletStats: (address: ApiAddress, opts?: { signal?: AbortSignal }) =>
    get<WalletStats>(`/wallets/${address}/stats`, undefined, { signal: opts?.signal }),

  /** `GET /v1/wallets/{address}/tickets` — cross-drawing wallet tickets. */
  walletTickets: (address: ApiAddress, opts?: ApiCallOptions) =>
    get<Page<Ticket>>(
      `/wallets/${address}/tickets`,
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),

  /** `GET /v1/wallets/{address}/tickets/rounds/{roundId}` — wallet tickets for one round. */
  walletTicketsForRound: (address: ApiAddress, roundId: string | bigint, opts?: ApiCallOptions) =>
    get<Page<Ticket>>(
      `/wallets/${address}/tickets/rounds/${roundId}`,
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),

  /**
   * `GET /v1/wallets/{address}/wins` — cross-drawing wallet wins.
   *
   * `claimed` filter (API v1.6.0): `undefined` returns every win (claimed
   * + unclaimed), `true` returns only claimed, `false` returns only
   * unclaimed. The kit's `<UnclaimedWins>` surface passes `false`; forks
   * that want a lifetime history pass `undefined` (or omit).
   */
  walletWins: (address: ApiAddress, opts?: ApiCallOptions & { claimed?: boolean }) =>
    get<Page<Win>>(
      `/wallets/${address}/wins`,
      {
        limit: opts?.limit,
        cursor: opts?.cursor,
        claimed: opts?.claimed?.toString(),
      },
      { signal: opts?.signal },
    ),

  /** `GET /v1/wallets/{address}/wins/rounds/{roundId}` — wallet wins in one round. */
  walletWinsForRound: (address: ApiAddress, roundId: string | bigint, opts?: ApiCallOptions) =>
    get<Page<Win>>(
      `/wallets/${address}/wins/rounds/${roundId}`,
      { limit: opts?.limit, cursor: opts?.cursor },
      { signal: opts?.signal },
    ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse an API `Amount` into a 6-decimal USDC bigint. Other tokens use raw-units math. */
export function amountToBigInt(a: Amount | null | undefined): bigint | undefined {
  if (!a) return undefined;
  return BigInt(a.amount);
}
