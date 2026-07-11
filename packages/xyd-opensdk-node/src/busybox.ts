import type { BusyboxOptions, BusyboxStyle } from './types';

/** A resolved busybox config: a concrete style + the namespace export name. */
export interface ResolvedBusybox {
  style: BusyboxStyle;
  /** The `'namespace'`-style export name (default `'busybox'`); unused otherwise. */
  name: string;
}

/** Normalize the `busybox` option into a concrete config, or `null` when disabled. */
export function resolveBusybox(
  option: boolean | BusyboxStyle | BusyboxOptions | undefined,
): ResolvedBusybox | null {
  if (!option) return null;
  if (option === true) return { style: 'namespace', name: 'busybox' };
  if (typeof option === 'string') return { style: option, name: 'busybox' };
  return { style: option.style ?? 'namespace', name: option.name?.trim() || 'busybox' };
}

/**
 * The PUBLIC helper names, in declaration order. Shared by every exposure style
 * (the flat re-export list, the namespace object's members, and the client's
 * static members) so the four variants stay in lockstep.
 */
export const BUSYBOX_EXPORTS = [
  'isAPIError',
  'isStatus',
  'isNotFound',
  'isUnauthorized',
  'isForbidden',
  'isConflict',
  'isRateLimited',
  'isServerError',
  'errMessage',
  'apiErrMessage',
] as const;

/**
 * Emit `src/busybox.ts`: error-handling helpers built on the SDK's `APIError`.
 * ONE definition, shared by all exposure styles — the package index re-exports
 * these (flat / namespace) or the client class aliases them as statics.
 */
export function renderBusyboxFile(): string {
  return `import { APIError } from './core/error';

/** True when \`err\` is an APIError (a non-2xx API response), narrowing the type. */
export function isAPIError(err: unknown): err is APIError {
  return err instanceof APIError;
}

/** True when \`err\` is an APIError carrying the given HTTP status. */
export function isStatus(err: unknown, status: number): boolean {
  return err instanceof APIError && err.status === status;
}

/** True when \`err\` is a 404 Not Found API response. */
export function isNotFound(err: unknown): boolean {
  return isStatus(err, 404);
}

/** True when \`err\` is a 401 Unauthorized API response. */
export function isUnauthorized(err: unknown): boolean {
  return isStatus(err, 401);
}

/** True when \`err\` is a 403 Forbidden API response. */
export function isForbidden(err: unknown): boolean {
  return isStatus(err, 403);
}

/** True when \`err\` is a 409 Conflict API response. */
export function isConflict(err: unknown): boolean {
  return isStatus(err, 409);
}

/** True when \`err\` is a 429 Too Many Requests API response. */
export function isRateLimited(err: unknown): boolean {
  return isStatus(err, 429);
}

/** True when \`err\` is a 5xx server-side API response. */
export function isServerError(err: unknown): boolean {
  return err instanceof APIError && err.status >= 500;
}

/** A human message for ANY thrown value: an Error's \`message\`, else \`String(err)\`. */
export function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Prefer the API's real \`message\` (carried in the JSON body of an APIError) over
 * the generic "failed with status N"; falls back to {@link errMessage} otherwise. */
export function apiErrMessage(err: unknown): string {
  if (err instanceof APIError) {
    try {
      const body = JSON.parse(err.body) as { message?: string };
      if (body?.message) return body.message;
    } catch {
      // body wasn't JSON — fall through to the SDK's message
    }
    return err.message;
  }
  return errMessage(err);
}
`;
}

/**
 * The `src/index.ts` re-export line for the busybox helpers, or `null` for the
 * `'static'` style (whose helpers live on the client class, not the package root).
 */
export function busyboxIndexExport(busybox: ResolvedBusybox): string | null {
  switch (busybox.style) {
    case 'flat':
      return `export { ${BUSYBOX_EXPORTS.join(', ')} } from './busybox';`;
    case 'namespace':
      return `export * as ${busybox.name} from './busybox';`;
    default:
      // 'static' — exposed as members of the client class instead.
      return null;
  }
}

/**
 * The client-class contribution for the `'static'` style: the busybox import +
 * the `static <name> = busybox.<name>;` alias lines. `null` for other styles.
 */
export function busyboxClientStatics(
  busybox: ResolvedBusybox,
): { importLine: string; staticLines: string[] } | null {
  if (busybox.style !== 'static') return null;
  return {
    importLine: `import * as busybox from './busybox';`,
    staticLines: BUSYBOX_EXPORTS.map((name) => `  static ${name} = busybox.${name};`),
  };
}
