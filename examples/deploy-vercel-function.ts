// NOT ACTIVE BY DEFAULT.
//
// To deploy the Hono proxy as a Vercel Function:
//   1. Copy this file to `api/megapot/[...path].ts` at the repo root.
//   2. Install `@hono/node-server`:
//        pnpm add @hono/node-server
//   3. Set `MEGAPOT_API_KEY` (no VITE_ prefix) in your Vercel project's
//      server-side env vars — Project Settings → Environment Variables.
//   4. Set `VITE_API_BASE_URL=/api/megapot` in your client-side env so
//      the browser bundle hits the proxy instead of api.megapot.io directly.
//
// Verify against the latest `@hono/node-server` docs in case the export
// path changes: https://hono.dev/getting-started/vercel
//
// The wrapper itself is tiny — `server/proxy.ts` is the framework-agnostic
// Hono app; this file just bridges it to Vercel's Node runtime.

import { handle } from '@hono/node-server/vercel';
import app from '../server/proxy';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
