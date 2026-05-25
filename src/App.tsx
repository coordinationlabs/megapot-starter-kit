/**
 * ---
 * @customize  Tab state lives here. 5 pages don't justify a router — keeps
 *             the dependency graph one file shallower. Swap to TanStack
 *             Router (or React Router) when you need URL state or
 *             deep-linking; each page is self-contained so deletion stays
 *             cheap.
 * ---
 */
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import type { NavKey } from '@/components/layout/Nav';
import { LP_ENABLED } from '@/config/contracts';
import { History } from '@/pages/History';
import { Home } from '@/pages/Home';
import { LP } from '@/pages/LP';
import { Play } from '@/pages/Play';
import { Tickets } from '@/pages/Tickets';

export default function App() {
  const [active, setActive] = useState<NavKey>('home');

  let page: ReactNode;
  switch (active) {
    case 'home':
      page = <Home onNavigate={setActive} />;
      break;
    case 'play':
      page = <Play />;
      break;
    case 'tickets':
      page = <Tickets onNavigate={setActive} />;
      break;
    case 'lp':
      // Defensive fallback for programmatic `active='lp'` while LP is
      // disabled (the nav entry is filtered out, so the user can't get here
      // by clicking). Renders Home instead of a blank screen.
      page = LP_ENABLED ? <LP /> : <Home onNavigate={setActive} />;
      break;
    case 'history':
      page = <History />;
      break;
  }

  return (
    <Layout active={active} onSelect={setActive}>
      {page}
    </Layout>
  );
}
