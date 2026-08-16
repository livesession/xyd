// @xyd-js/openapi2opencli public API (S6+ W7 shim): the OpenAPI→OpenCLI
// conversion dispatches to the Rust core (crates/xyd_openapi2opencli via
// @xyd-js/native) for local-file specs, else the frozen JS impl. The
// conformance-surface utilities stay JS tooling.
import type { OpenAPIV3 } from 'openapi-types';
import type { OpencliSpecJson } from '@xyd-js/opencli';

import { native, NATIVE_SOURCE } from './native';
import {
  openapi2opencli as jsOpenapi2opencli,
  openapi2opencliFromSource as jsOpenapi2opencliFromSource,
} from './impl-js/openapi2opencli';
import type { OpenApi2OpenCliOptions } from './impl-js/types';

export type { OpenApi2OpenCliOptions, VerbMap, Grouping, BodyStrategy, FlagCase } from './impl-js/types';
export { DEFAULT_CUSTOM_ACTION_VERBS } from './impl-js/types';
export { opencliToSurface, diffSurfaces } from './impl-js/surface';
export type { CliSurface, SurfaceCommand, SurfaceFlag, FlagKind, SurfaceDiff, Allowlist } from './impl-js/surface';

function isLocalFile(source: unknown): source is string {
  return typeof source === 'string' && !source.startsWith('http://') && !source.startsWith('https://');
}

/** Convert a (dereferenced) OpenAPI doc to OpenCLI. Native for local-file specs
 *  (re-reads from the source stashed by deferencedOpenAPI); JS otherwise. */
export function openapi2opencli(
  doc: OpenAPIV3.Document,
  options: OpenApi2OpenCliOptions = {},
): OpencliSpecJson {
  const source: unknown = (doc as any)?.[NATIVE_SOURCE];
  if (native?.openapi2opencliFromFile && isLocalFile(source)) {
    return JSON.parse(native.openapi2opencliFromFile(source, JSON.stringify(options)));
  }
  return jsOpenapi2opencli(doc, options);
}

/** Read + deref a spec file/URL then convert. Native re-reads local files in
 *  Rust; URL specs stay JS. */
export async function openapi2opencliFromSource(
  source: string,
  options: OpenApi2OpenCliOptions = {},
): Promise<OpencliSpecJson> {
  if (native?.openapi2opencliFromFile && isLocalFile(source)) {
    return JSON.parse(native.openapi2opencliFromFile(source, JSON.stringify(options)));
  }
  return jsOpenapi2opencliFromSource(source, options);
}
