/**
 * Oracle cases for `generateSdkFileMap` (genframework/sdk.ts).
 *
 * `generateSdkFileMap` is the DB-free compute core of the SDK pipeline — verified: the
 * 226..391 range references no `pool`, `jobQ`, `notifQ` or client. `runSdkGeneration` is
 * the Postgres-backed job wrapper around it and is deliberately NOT oracled here.
 *
 * Unlike the wizard's preview, this caller KEEPS `.sdk/sdk.lock`: the regen manifest
 * ships inside the delivered SDK tree, so it is load-bearing output, not noise.
 *
 * Section keys are not language ids (see SECTION_KEY in sdk.ts): node -> "typescript",
 * dotnet -> "csharp". Getting them wrong makes a case exercise nothing.
 */
export const LANGUAGES = ["go", "node", "python", "ruby", "java", "dotnet"];

export interface OracleCase {
  id: string;
  /** why this case exists — printed on failure so a red explains itself */
  axis: string;
  /** merged into the generateSdkFileMap argument */
  opts: Record<string, unknown>;
}

export const CASES: OracleCase[] = [
  {
    id: "1.bare",
    axis: "defaults only — the minimal call the job runner makes",
    opts: {},
  },
  {
    id: "2.identity",
    axis: "package identity: sdkName/api/sdkId/sdkVersion/packageName -> sdk.json + manifest + toSemver",
    opts: {
      sdkName: "acme SDK",
      api: "apis/acme/acme-public-api@v1",
      sdkId: "acme-sdk",
      sdkVersion: "v2.4",
      packageName: "@acme/sdk",
    },
  },
  {
    id: "3.sdkjson-sections",
    axis: "wizard flow: per-language emitter options through the section key",
    opts: {
      sdkJson: {
        sdkName: "acme",
        go: { packageName: "acmego", modulePath: "github.com/acme/go-sdk" },
        typescript: { packageName: "@acme/sdk", exportDefault: true },
        python: { packageName: "acme_sdk" },
        ruby: { packageName: "acme_sdk", moduleName: "AcmeSdk" },
        java: { packageName: "acme-sdk", basePackage: "com.acme.sdk" },
        csharp: { namespace: "Acme.Sdk" },
      },
    },
  },
  {
    id: "4.sdkjson-behavior",
    axis: "two-layer behavior fold (global + per-language) reaching the generated runtime",
    opts: {
      sdkJson: {
        sdkName: "acme",
        behavior: {
          timeout: { requestTimeoutMs: 4321 },
          retry: { maxRetries: 2 },
          errors: { statusCodeMap: { "404": "Missing" } },
        },
        go: { behavior: { retry: { maxRetries: 9 } } },
        typescript: { behavior: { timeout: { requestTimeoutMs: 999 } } },
      },
    },
  },
  {
    id: "5.sdkjson-grouping",
    axis: "converter grouping reshapes the resource tree -> different file names",
    opts: {
      sdkJson: {
        sdkName: "acme",
        grouping: {
          operationHints: {
            "POST /pets": { mountOn: "beta/pets", action: "spawn" },
          },
        },
      },
    },
  },
];
