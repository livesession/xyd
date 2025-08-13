/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_URL: string
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 