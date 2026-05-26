/**
 * ---
 * @customize  Demo-branch-only. Auto-connects the single demo connector on
 *             mount so visitors land already "connected" to the showcase
 *             wallet without ever seeing a wallet picker.
 *
 *             Renders nothing — pure effect. Mount once at the top of the
 *             tree inside the wagmi provider.
 * ---
 */
import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export function DemoAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected && connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connect, connectors]);

  return null;
}
