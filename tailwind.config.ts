import type { Config } from 'tailwindcss';

/**
 * Lock the body + monospace stacks so numbers (countdowns, balances, ticket
 * IDs) and prose render the same on every OS. We intentionally avoid a Google
 * Fonts import — the system stack is faster, has zero network cost, and keeps
 * a forkable demo "no bells and whistles" per spec.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * Brand color tokens — the single rebrand surface.
       *
       * Defaults to Tailwind's emerald scale (the kit ships as
       * Megapot-emerald-green). A fork changes its identity by editing
       * `brand.primary` here; every `bg-brand-primary-600`,
       * `text-brand-primary-900`, etc. across `src/` updates in one place.
       *
       * Semantic colors (`amber-*`, `rose-*`, `zinc-*`) are intentionally
       * NOT brand tokens — they convey meaning (warning / error / neutral)
       * and stay stable across rebrands.
       *
       * @customize Swap the values below for your fork's brand scale (e.g.
       *            indigo, violet, sky). Generate a full 50-950 scale via
       *            https://uicolors.app/create or copy a Tailwind built-in.
       */
      colors: {
        brand: {
          primary: {
            50: 'rgb(236 253 245)',
            100: 'rgb(209 250 229)',
            200: 'rgb(167 243 208)',
            300: 'rgb(110 231 183)',
            400: 'rgb(52 211 153)',
            500: 'rgb(16 185 129)',
            600: 'rgb(5 150 105)',
            700: 'rgb(4 120 87)',
            800: 'rgb(6 95 70)',
            900: 'rgb(6 78 59)',
            950: 'rgb(2 44 34)',
          },
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
