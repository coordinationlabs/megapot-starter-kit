# Examples

Reference snippets for deploying the kit's Data API proxy
(`server/proxy.ts`) on common backends. **None of these files are
active by default** — copy / wire them into your fork only if you
want proxy-mode (the third tier of API key handling; see
`.env.example`).

| File | What it shows |
|------|---------------|
| `deploy-vercel-function.ts` | Mount `server/proxy.ts` as a Vercel Function using `@hono/node-server/vercel`. Copy to `api/megapot/[...path].ts`. |
| `deploy-cloudflare-worker.ts` | Mount `server/proxy.ts` as a Cloudflare Worker (re-exports the default Hono app). Pair with a `wrangler.toml`. |

For Node container / Bun / Deno deployments, import `app` from
`server/proxy.ts` and call the host's standard Hono adapter
(`@hono/node-server` for Node, `Bun.serve(app.fetch)` for Bun, etc.).

The proxy itself is framework-agnostic — only the bootstrap wrapper
differs across platforms.
