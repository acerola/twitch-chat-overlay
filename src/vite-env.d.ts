/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHANNEL_NAME?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_TWITCH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
