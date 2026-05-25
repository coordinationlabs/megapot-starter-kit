/**
 * ---
 * @skill      https://llms.megapot.io/tasks/react-setup
 * @customize  Mobile-only wallet strip rendered inside the sticky header,
 *             below the brand row. Surfaces the wallet affordances that
 *             ProfileCard hides on small viewports: a full-width Connect
 *             CTA when disconnected, or address + ETH/USDC balances +
 *             Disconnect when connected. Hidden on `md+` (the same
 *             breakpoint at which `Nav` flips from bottom-tab-bar to
 *             top-tab-row and `ProfileCard` reclaims the wallet slots
 *             inline with the brand row).
 *
 *             Forks that want a different mobile-wallet shape (e.g. a
 *             "tap to open" sheet, or only the balance with no Disconnect)
 *             swap this component. The desktop path in `ProfileCard` is
 *             unaffected.
 * ---
 */
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { Button } from '@/components/common/Button';
import { CopyButton } from '@/components/common/CopyButton';
import { USDC_DECIMALS } from '@/config/contracts';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';

function fmt(value: bigint | undefined, decimals: number, precision = 4) {
  if (value === undefined) return '—';
  return Number(formatUnits(value, decimals)).toFixed(precision);
}

function shortenAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function MobileWalletBar() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  });
  const { balance: usdcBalance } = useUsdcBalance(address);
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        // `mounted` flips true after RainbowKit hydrates — until then we
        // can't know whether a session exists, so render nothing.
        if (!mounted) return null;

        if (!account || !chain) {
          return (
            <div className="border-t border-zinc-200 px-4 py-2 md:hidden dark:border-zinc-800">
              <Button variant="primary" size="sm" onClick={openConnectModal} className="w-full">
                Connect wallet
              </Button>
            </div>
          );
        }

        if (chain.unsupported) {
          return (
            <div className="border-t border-zinc-200 px-4 py-2 md:hidden dark:border-zinc-800">
              <Button variant="danger" size="sm" onClick={openChainModal} className="w-full">
                Wrong network — switch
              </Button>
            </div>
          );
        }

        const addr = account.address as `0x${string}`;
        return (
          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-4 py-2 text-xs md:hidden dark:border-zinc-800">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] font-medium text-zinc-800 dark:text-zinc-200"
                title={addr}
              >
                {shortenAddress(addr)}
              </span>
              <CopyButton value={addr} label="Copy address" className="h-3.5 w-3.5" />
              <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
              <span className="text-zinc-500">ETH</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                {fmt(ethBalance?.value, 18, 3)}
              </span>
              <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
              <span className="text-zinc-500">USDC</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                {fmt(usdcBalance, USDC_DECIMALS, 2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => disconnect()}
              className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Disconnect wallet"
            >
              Disconnect
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
