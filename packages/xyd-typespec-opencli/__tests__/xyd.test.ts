import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createTestHost,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";

const LIB_NAME = "@xyd-js/typespec-opencli";
const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "__fixtures__");

/** Compile a `.tsp` source string with the emitter and return the emitted opencli.json. */
async function emit(source: string, version: string): Promise<string> {
  const lib = createTestLibrary({
    name: LIB_NAME,
    packageRoot: await findTestPackageRoot(import.meta.url),
  });
  const host = await createTestHost({ libraries: [lib] });
  host.addTypeSpecFile("main.tsp", source);

  await host.compile("main.tsp", {
    emit: [LIB_NAME],
    options: { [LIB_NAME]: { version } },
    outputDir: "tsp-output",
  });

  for (const [path, content] of host.fs) {
    if (path.endsWith("opencli.json")) return content as string;
  }
  throw new Error("emitter did not produce opencli.json");
}

describe("@xyd-js/typespec-opencli", () => {
  it("emits an OpenCLI document byte-identical to the committed golden", async () => {
    const source = readFileSync(join(fixtures, "xyd.tsp"), "utf8");
    const golden = readFileSync(join(fixtures, "opencli.golden.json"), "utf8");

    const output = await emit(source, "0.1.0-build.342");

    expect(output).toBe(golden);
  });

  it("defaults info.version to 0.0.0 when the version option is omitted", async () => {
    const source = `
      import "@xyd-js/typespec-opencli";
      using XydCli;
      @cli(#{ title: "x", description: "d" })
      namespace X;
      @command @doc("run it") op run(): void;
    `;
    const lib = createTestLibrary({
      name: LIB_NAME,
      packageRoot: await findTestPackageRoot(import.meta.url),
    });
    const host = await createTestHost({ libraries: [lib] });
    host.addTypeSpecFile("main.tsp", source);
    await host.compile("main.tsp", { emit: [LIB_NAME], outputDir: "tsp-output" });

    let out: string | undefined;
    for (const [path, content] of host.fs) {
      if (path.endsWith("opencli.json")) out = content as string;
    }
    expect(out).toBeDefined();
    expect(JSON.parse(out!).info.version).toBe("0.0.0");
  });
});
