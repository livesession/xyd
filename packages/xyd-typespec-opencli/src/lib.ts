import { createTypeSpecLibrary } from "@typespec/compiler";

/** Options accepted by the `@xyd-js/typespec-opencli` emitter. */
export interface XydCliEmitterOptions {
  /**
   * The value written to OpenCLI `info.version`. Supplied at compile time
   * (e.g. from the CLI package version); defaults to `"0.0.0"` when omitted.
   */
  version?: string;
}

export const $lib = createTypeSpecLibrary({
  name: "@xyd-js/typespec-opencli",
  diagnostics: {
    "missing-cli-namespace": {
      severity: "error",
      messages: {
        default:
          "No @cli namespace found. Mark the CLI's root namespace with @cli(#{ title, description }).",
      },
    },
  },
  state: {
    cli: {},
    command: {},
    argument: {},
    option: {},
    globalOptions: {},
    aka: {},
    example: {},
  },
  emitter: {
    options: {
      type: "object",
      additionalProperties: false,
      properties: {
        version: { type: "string", nullable: true },
      },
      required: [],
    } as const,
  },
});

export const { reportDiagnostic, createStateSymbol } = $lib;
