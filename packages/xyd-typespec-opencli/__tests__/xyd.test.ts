import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compile, NodeHost } from "@typespec/compiler";
import { describe, expect, it } from "vitest";

const LIB_NAME = "@xyd-js/typespec-opencli";
const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "__fixtures__");

function findFile(dir: string, name: string): string | undefined {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      const found = findFile(p, name);
      if (found) return found;
    } else if (entry === name) {
      return p;
    }
  }
  return undefined;
}

/**
 * Compile a fixture `.tsp` through the REAL compiler (`compile(NodeHost, …)`)
 * with our emitter, and return the emitted `opencli.json`. We deliberately avoid
 * `@typespec/compiler/testing`'s `createTestHost` — its in-memory library glob
 * (`findFilesFromPattern`) is incompatible with some Node versions. This mirrors
 * exactly how `specs/xyd-cli/build.mjs` runs the emitter in production.
 */
async function emit(mainTsp: string, version?: string): Promise<string> {
  const outputDir = mkdtempSync(join(tmpdir(), "tsopencli-"));
  try {
    const program = await compile(NodeHost, resolve(mainTsp), {
      emit: [LIB_NAME],
      options: version ? { [LIB_NAME]: { version } } : {},
      outputDir,
    });
    const errors = program.diagnostics.filter((d) => d.severity === "error");
    if (errors.length) {
      throw new Error(`compile errors:\n${errors.map((d) => d.message).join("\n")}`);
    }
    const file = findFile(outputDir, "opencli.json");
    if (!file) throw new Error("emitter did not produce opencli.json");
    return readFileSync(file, "utf8");
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

describe("@xyd-js/typespec-opencli", () => {
  it("emits an OpenCLI document byte-identical to the committed golden", async () => {
    const golden = readFileSync(join(fixtures, "opencli.golden.json"), "utf8");
    const output = await emit(join(fixtures, "xyd.tsp"), "0.1.0-build.342");
    expect(output).toBe(golden);
  });

  it("defaults info.version to 0.0.0 when the version option is omitted", async () => {
    const output = await emit(join(fixtures, "version-default.tsp"));
    expect(JSON.parse(output).info.version).toBe("0.0.0");
  });
});
