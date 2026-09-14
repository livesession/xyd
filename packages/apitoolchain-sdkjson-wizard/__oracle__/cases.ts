/**
 * Oracle cases for `runOpensdkPreview`.
 *
 * Each case targets ONE axis of the preview pipeline, so a red golden points at a
 * cause instead of just "something moved". The matrix is `LANGUAGES x CASES`.
 *
 * Section keys are NOT the language ids: the preview reads `sdk[LANGUAGE_META[lang].sectionKey]`,
 * where node -> "typescript" and dotnet -> "csharp". Getting those wrong makes a case
 * silently exercise nothing — which is exactly how an oracle ends up unable to fail.
 */
import type { SdkLanguage } from "../src/model/types";

export const LANGUAGES: SdkLanguage[] = [
  "go",
  "node",
  "python",
  "ruby",
  "java",
  "dotnet",
];

/** Two distinct endpoints folded onto ONE resource chain via `mountOn`.
 *
 * This exercises cross-resource mounting and the converter's action de-duplication
 * (the second `list` becomes `list2`), which is what shifts operation ids.
 *
 * It deliberately does NOT test the (httpMethod, path) collision that the native
 * docs-map key can suffer: that map is keyed `"<httpmethod> <path>"`, so two chains
 * sharing one endpoint would collapse last-writer-wins. OpenAPI paths are unique per
 * method, so no `doc` + `sdk.json` pair reachable through this API can produce that —
 * verified, not assumed. The guard against it is therefore defensive and is covered by
 * a direct unit test (`__oracle__/guard.test.ts`), not by a golden here. */
const MULTI_RESOURCE_DOC = {
  openapi: "3.0.3",
  info: { title: "Collide", version: "1.0.0" },
  servers: [{ url: "https://api.collide.test/v1" }],
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        tags: ["pets"],
        responses: { "200": { description: "ok" } },
      },
    },
    "/aliases": {
      get: {
        operationId: "listAliases",
        tags: ["aliases"],
        responses: { "200": { description: "ok" } },
      },
    },
  },
};

/** Deliberately invalid: no `openapi` field. Freezes the `{files: [], error}` shape AND
 * the exact message, including the native converter's `[xyd_openapi2opensdk] ` prefix —
 * which is already today's live behavior, not something the rewire introduces. */
const INVALID_DOC = { info: { title: "Bad", version: "1" }, paths: {} };

export interface OracleCase {
  id: string;
  /** why this case exists — printed on failure so a red is self-explaining */
  axis: string;
  sdkJson: Record<string, unknown>;
  doc?: unknown;
}

export const CASES: OracleCase[] = [
  {
    id: "1.bare",
    axis: "defaults only — proves the no-options transport",
    sdkJson: { sdkName: "acme" },
  },
  {
    id: "2.sections",
    axis: "emitterOptions threading + RESERVED_SECTION_KEYS filter + publish identity + toSemver",
    sdkJson: {
      sdkName: "acme",
      publish: { version: "v2.3", author: "Acme Inc", license: "MIT" },
      go: {
        packageName: "acmego",
        modulePath: "github.com/acme/go-sdk",
        goVersion: "1.23",
      },
      typescript: {
        packageName: "@acme/sdk",
        exportDefault: true,
        busybox: true,
      },
      python: { packageName: "acme_sdk" },
      ruby: { packageName: "acme_sdk", moduleName: "AcmeSdk" },
      java: { packageName: "acme-sdk", basePackage: "com.acme.sdk" },
      csharp: { namespace: "Acme.Sdk", targetFramework: "net8.0" },
    },
  },
  {
    id: "3.behavior",
    axis: "two-layer behavior fold (global + per-language); objects merge, scalars replace",
    sdkJson: {
      sdkName: "acme",
      behavior: {
        timeout: { requestTimeoutMs: 4321 },
        retry: { maxRetries: 2 },
        errors: { statusCodeMap: { "404": "Missing" } },
      },
      go: { behavior: { retry: { maxRetries: 9 }, logging: { enabled: true } } },
      typescript: { behavior: { timeout: { requestTimeoutMs: 999 } } },
    },
  },
  {
    id: "4.grouping",
    axis: "converter options that reshape the resource tree, hence operation ids + file names",
    sdkJson: {
      sdkName: "acme",
      grouping: {
        operationHints: {
          "POST /pets": { mountOn: "beta/pets", action: "spawn" },
        },
      },
    },
  },
  {
    id: "5.error",
    axis: "error shape + exact message (native prefix is the live baseline)",
    sdkJson: { sdkName: "acme" },
    doc: INVALID_DOC,
  },
  {
    id: "6.multiresource",
    axis: "cross-resource mountOn + converter action de-duplication (list -> list2)",
    sdkJson: {
      sdkName: "acme",
      grouping: {
        operationHints: {
          "GET /aliases": { mountOn: "pets", action: "list" },
        },
      },
    },
    doc: MULTI_RESOURCE_DOC,
  },
];
