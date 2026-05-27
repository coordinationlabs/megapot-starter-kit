/**
 * ---
 * @skill      https://llms.megapot.io/tasks/buy-tickets
 *             https://llms.megapot.io/tasks/buy-bulk
 *             https://llms.megapot.io/tasks/subscribe
 * @customize  Single page that routes to one of three contracts based on
 *             input shape — see `pickPurchaseRoute` in `lib/tickets.ts` for
 *             the decision matrix. Each route uses its own hook + approval
 *             target.
 * ---
 */
import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import {
  BATCH_PURCHASE_FACILITATOR_ADDRESS,
  JACKPOT_ADDRESS,
  JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
} from '@/config/contracts';
import { COPY } from '@/config/copy';
import { DEMO_MODE } from '@/config/demoConnector';
import { API_BASE_URL, QK } from '@/lib/api';
import { pickPurchaseRoute, totalCost as computeTotalCost, type CustomTicket } from '@/lib/tickets';
import { useConfirmedFlash } from '@/hooks/useConfirmedFlash';
import { useJackpotState } from '@/hooks/useJackpotState';
import { useBuyTickets } from '@/hooks/useBuyTickets';
import { useBulkPurchase } from '@/hooks/useBulkPurchase';
import { useSubscribe } from '@/hooks/useSubscribe';
import { ApprovalButton } from '@/components/common/ApprovalButton';
import { Button } from '@/components/common/Button';
import { TxStatus } from '@/components/common/TxStatus';
import { UsdcAmount } from '@/components/common/UsdcAmount';
import { SubscriptionToggle, type BuyMode } from '@/components/lottery/SubscriptionToggle';
import { TicketBuilder } from '@/components/lottery/TicketBuilder';
import { BulkProgress } from '@/components/lottery/BulkProgress';
import { ActiveSubscription } from '@/components/tickets/ActiveSubscription';

export function Play() {
  const { isConnected } = useAccount();
  const { state, phase, refetch: refetchJackpotState } = useJackpotState();
  const ticketPrice = state?.ticketPrice;

  const [mode, setMode] = useState<BuyMode>('one-time');
  const [count, setCount] = useState<number>(1);
  const [totalDays, setTotalDays] = useState<number>(7);
  const [customTickets, setCustomTickets] = useState<CustomTicket[]>([]);

  const route = pickPurchaseRoute({ count, recurring: mode === 'subscription' });

  const cost = useMemo(
    () =>
      ticketPrice !== undefined
        ? computeTotalCost({
            ticketPriceUsdcRaw: ticketPrice,
            count,
            totalDays: mode === 'subscription' ? totalDays : 1,
          })
        : undefined,
    [ticketPrice, count, totalDays, mode],
  );

  const spender = (
    {
      jackpot: JACKPOT_ADDRESS,
      bulk: BATCH_PURCHASE_FACILITATOR_ADDRESS,
      subscribe: JACKPOT_AUTO_SUBSCRIPTION_ADDRESS,
    } as const
  )[route];

  const buy = useBuyTickets();
  const bulk = useBulkPurchase();
  const sub = useSubscribe();
  const queryClient = useQueryClient();

  // Reset write-hook state when route changes so a stale "Confirmed" pill from
  // one route doesn't leak into another. `route` is the change trigger; the
  // `.reset` callbacks are stable references but listed so Biome knows we're
  // calling them deliberately.
  // biome-ignore lint/correctness/useExhaustiveDependencies: route is the trigger; reset() bodies do not use it
  useEffect(() => {
    buy.reset();
    bulk.create.reset();
    sub.create.reset();
  }, [route, buy.reset, bulk.create.reset, sub.create.reset]);

  // Invalidate the wallet-scoped Data API caches the moment a buy confirms so
  // the Tickets page reflects the new ticket without waiting for staleTime to
  // expire. The matching read paths live in `useUserTickets`,
  // `useWalletWins`, and `useWalletStats`.
  //
  // Also force-refetch the jackpot state — `globalTicketsBought` (rendered as
  // "Tickets sold" on Home) has no contract event we can subscribe to, so
  // without an explicit refetch the homepage stat lags by up to one
  // polling window (30 s during the `open` phase). USDC balance + allowance
  // self-refresh via their own Transfer / Approval event watchers in
  // `useUsdcBalance` + `useUsdcAllowance`, so nothing else needs nudging here.
  const buyJustConfirmed = buy.isSuccess || bulk.create.isSuccess || sub.create.isSuccess;
  useEffect(() => {
    if (!buyJustConfirmed) return;
    for (const resource of [
      QK.walletTicketsByRound,
      QK.walletTickets,
      QK.walletStats,
      QK.walletWins,
    ]) {
      queryClient.invalidateQueries({
        queryKey: [QK.NS, API_BASE_URL, resource],
      });
    }
    refetchJackpotState();
  }, [buyJustConfirmed, queryClient, refetchJackpotState]);

  const buyDisabled =
    !isConnected || !cost || cost === 0n || customTickets.length > count || phase !== 'open';

  const onSubmit = () => {
    const randomCount = Math.max(0, count - customTickets.length);
    if (route === 'jackpot') {
      // Jackpot.buyTickets has no on-chain quick-pick — every ticket must
      // carry 5 normals + a non-zero bonusball or the contract reverts.
      // We need the drawing's ball-pool bounds to generate valid random
      // tickets client-side inside the hook; guard the submit if state
      // hasn't loaded yet (buyDisabled also covers the !cost case).
      if (state?.ballMax === undefined || state?.bonusballMax === undefined) return;
      buy.buy({
        customTickets,
        randomCount,
        ballMax: state.ballMax,
        bonusballMax: state.bonusballMax,
      });
    } else if (route === 'bulk') {
      bulk.createOrder({ dynamicCount: randomCount, staticTickets: customTickets });
    } else {
      sub.createSubscription({
        totalDays,
        dynamicCount: randomCount,
        staticTickets: customTickets,
      });
    }
  };

  const activeWrite = route === 'jackpot' ? buy : route === 'bulk' ? bulk.create : sub.create;

  // Brief "✓ Done!" window after the tx confirms — keeps the user on the same
  // page (no jarring snap back to the idle label) and auto-resets the write
  // hook so the button returns to its normal state once the moment passes.
  const confirmed = useConfirmedFlash(activeWrite.isSuccess, activeWrite.reset);

  // In-flight bulk order surfacing — read on mount + live event updates
  const orderInfo = bulk.orderInfo as
    | {
        batchOrder: {
          totalTicketsOrdered: bigint;
          remainingTickets: bigint;
          remainingUSDC: bigint;
        };
      }
    | undefined;
  const hasInFlightOrder = orderInfo && orderInfo.batchOrder.remainingTickets > 0n;

  return (
    <div className="space-y-4">
      {DEMO_MODE && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Read-only demo — ticket purchases are disabled. Fork the kit to enable buying.
        </div>
      )}

      {!isConnected && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {COPY.connectToBuy}
        </div>
      )}

      {phase !== 'open' && isConnected && (
        <div className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {COPY.ticketsPaused}. Wait for the next drawing to open.
        </div>
      )}

      {hasInFlightOrder && orderInfo && (
        <BulkProgress
          totalTickets={orderInfo.batchOrder.totalTicketsOrdered}
          remainingTickets={orderInfo.batchOrder.remainingTickets}
          remainingUSDC={orderInfo.batchOrder.remainingUSDC}
        />
      )}

      <section className="card-pad space-y-4">
        <SubscriptionToggle
          mode={mode}
          onModeChange={setMode}
          totalDays={totalDays}
          onTotalDaysChange={setTotalDays}
        />

        {/*
          Subscription mode is a two-flow surface. When an active
          subscription exists, the contract reverts
          `createSubscription` with `ActiveSubscriptionExists()` — the
          user must cancel and wait for on-chain confirmation before
          creating a new one. Rather than show both Create + Cancel
          surfaces (the pre-cleanup behavior), branch on
          `hasActiveSubscription` so only one path is ever visible:
            - active   → <ActiveSubscription /> (Cancel-only)
            - inactive → <TicketBuilder /> + Subscribe submit
          After `sub.cancel` confirms, `getSubscriptionInfo` reverts,
          `hasActiveSubscription` flips false, and the UI swaps to the
          Create surface naturally.

          The one-time mode is unaffected — the
          builder/total/approve/buy block below renders for any
          non-subscription route.
        */}
        {mode === 'subscription' && sub.hasActiveSubscription ? (
          <ActiveSubscription />
        ) : (
          <>
            <TicketBuilder
              ballMax={state?.ballMax}
              bonusballMax={state?.bonusballMax}
              count={count}
              onCountChange={setCount}
              customTickets={customTickets}
              onCustomTicketsChange={setCustomTickets}
            />

            <div className="flex items-baseline justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Total {mode === 'subscription' ? '(paid upfront)' : ''}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                <UsdcAmount value={cost} precision={2} />
              </span>
            </div>

            <ApprovalButton spender={spender} amount={cost ?? 0n}>
              <Button
                variant="primary"
                size="md"
                onClick={onSubmit}
                disabled={DEMO_MODE || buyDisabled || activeWrite.isPending || confirmed}
                title={DEMO_MODE ? 'Demo mode — disabled' : undefined}
                className="w-full"
              >
                {DEMO_MODE
                  ? 'Purchases disabled in this demo'
                  : activeWrite.isWaitingSignature
                    ? 'Sign in your wallet…'
                    : activeWrite.isMining
                      ? 'Confirming on-chain…'
                      : confirmed
                        ? route === 'subscribe'
                          ? '✓ Subscribed!'
                          : '✓ Bought!'
                        : route === 'jackpot'
                          ? `Buy ${count} ${count === 1 ? 'ticket' : 'tickets'}`
                          : route === 'bulk'
                            ? `Buy ${count} tickets in a batch`
                            : `Subscribe — ${count} ${count === 1 ? 'ticket' : 'tickets'} per drawing for ${totalDays} ${totalDays === 1 ? 'drawing' : 'drawings'}`}
              </Button>
            </ApprovalButton>

            <TxStatus
              hash={activeWrite.txHash}
              isPending={activeWrite.isPending}
              isSuccess={activeWrite.isSuccess}
              error={activeWrite.error}
            />

            {import.meta.env.DEV && (
              <p className="text-center text-xs text-zinc-500">
                Routing via{' '}
                <span className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] font-medium">
                  {route}
                </span>
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
