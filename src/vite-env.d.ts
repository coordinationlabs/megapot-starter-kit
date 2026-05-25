/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN: 'mainnet' | 'testnet';
  readonly VITE_RPC_URL: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  /** Optional Megapot Data API key (mpk_live_…). Anonymous tier without one. */
  readonly VITE_MEGAPOT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
