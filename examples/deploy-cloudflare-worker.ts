// NOT ACTIVE BY DEFAULT.
//
// To deploy the Hono proxy as a Cloudflare Worker:
//   1. Copy this file to a `worker/` directory (or wherever your Wrangler
//      build entry points to) and add a `wrangler.toml` at the repo root:
//        name = "megapot-proxy"
//        main = "worker/index.ts"
//        compatibility_date = "2026-05-20"
//      Match `main` to the path you used.
//   2. Add the Worker secret in the Cloudflare dashboard or via Wrangler:
//        wrangler secret put MEGAPOT_API_KEY
//   3. Route the Worker at the path you want proxy traffic to hit
//      (e.g. `/api/megapot/*` on your domain).
//   4. Set `VITE_API_BASE_URL=/api/megapot` in your static-site build so
//      the browser bundle hits the proxied path.
//
// Hono's Cloudflare adapter wires the app's `fetch` to the Workers runtime;
// no extra wrapper code is needed beyond re-exporting the default app.

import app from '../server/proxy';

export default app;
