import { config } from "../../../config";
import type {
  GetApiRow,
  ListApisRow,
  ListDistTagsRow,
  ListVersionsRow,
  UpsertApiRow,
} from "../../../dbnode/registry";
import type {
  ApiFormat,
  ApiVersion,
  DistTag,
  EntryKind,
  RegistryEntryCore,
} from "../../openapi/v1/src/generated/models/all/apitoolchain";

type ApiRow = ListApisRow | GetApiRow | UpsertApiRow;

export function toApiVersion(v: ListVersionsRow): ApiVersion {
  return {
    version: v.version,
    specUrl: v.specUrl,
    updatedAt: v.updatedAt.toISOString(),
    current: v.isCurrent,
  };
}

export function toDistTag(t: ListDistTagsRow): DistTag {
  return { tag: t.tag, version: t.version };
}

/** The canonical resolvable URL registry-api serves for an entry's latest spec. */
export function registryUrl(
  namespace: string,
  id: string,
  kind: EntryKind,
): string {
  const collection = kind === "schema" ? "schemas" : "apis";
  return `${config.publicUrl}/@${namespace}/${collection}/${id}@latest`;
}

export function toRegistryEntryCore(
  a: ApiRow,
  versions: ListVersionsRow[],
  distTags: ListDistTagsRow[],
): RegistryEntryCore {
  const kind = (a.kind as EntryKind) ?? "api";
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    format: a.format as ApiFormat,
    kind,
    ns: a.namespace,
    source: a.source,
    versions: versions.map(toApiVersion),
    distTags: distTags.map(toDistTag),
    registryUrl: registryUrl(a.namespace, a.id, kind),
    updatedAt: a.updatedAt.toISOString(),
  };
}
