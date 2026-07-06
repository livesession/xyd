import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request state, set once by the root route middleware and read by the
 * data layer (`app/data/api.ts`) so every server-to-server call to the
 * platform-api can forward the caller's bearer token — without threading it
 * through every accessor signature.
 */
interface RequestState {
  token?: string;
}

const storage = new AsyncLocalStorage<RequestState>();

/** Run `fn` (the middleware `next()`) with the request's session token bound. */
export function runWithToken<T>(token: string | undefined, fn: () => T): T {
  return storage.run({ token }, fn);
}

/**
 * Bridge for the data layer (`app/data/api.ts`) to read the token WITHOUT a
 * static import of this server-only module — `api.ts` is bundled for the client
 * (via the `~/data` barrel), so it can't statically depend on `node:async_hooks`.
 * This module is only ever loaded on the server (by the root middleware), so the
 * global is always registered before any request runs.
 */
(
  globalThis as typeof globalThis & {
    __atcCurrentToken?: () => string | undefined;
  }
).__atcCurrentToken = () => storage.getStore()?.token;
