import { copyFile, cp, readdir, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { defineConfig, type Options } from "tsup";

const config: Options = {
  entry: {
    index: "src/index.ts",
    XSpecPre: "src/components/XSpecPre.tsx",
    XSpec: "src/components/XSpec.tsx",
    XSpecWrapper: "src/components/XSpecWrapper.tsx",
    XSpecSection: "src/components/XSpecSection.tsx",
    Section: "src/components/XSpecSection.tsx",
  },
  dts: {
    entry: {
      index: "src/index.ts",
      XSpecPre: "src/components/XSpecPre.tsx",
      XSpec: "src/components/XSpec.tsx",
      XSpecWrapper: "src/components/XSpecWrapper.tsx",
      XSpecSection: "src/components/XSpecSection.tsx",
      Section: "src/components/XSpecSection.tsx",
    },
    resolve: true,
  },
  format: ["esm"],
  platform: "node",
  shims: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    ".css": "text",
  },
  onSuccess: async () => {
    const cwd = process.cwd();
    const distDir = join(cwd, "dist");

    const copyFlat = async (srcDir: string, exts: string[]) => {
      const entries = await readdir(srcDir, { withFileTypes: true });
      await Promise.all(
        entries
          .filter(
            (entry) =>
              entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))
          )
          .map((entry) =>
            cp(join(srcDir, entry.name), join(distDir, entry.name))
          )
      );
    };

    await Promise.all([
      copyFlat(join(cwd, "src", "styles"), [".css"]),
      rm(join(distDir, "components"), { recursive: true, force: true }),
      rm(join(distDir, "styles"), { recursive: true, force: true }),
    ]);

    const distIndexPath = join(distDir, "index.js");
    try {
      let content = await readFile(distIndexPath, "utf8");
      const reactImportPattern = /import React\d* from "react";\n?/g;
      const hasReactImport = /import React from "react";/.test(content);
      content = content.replace(reactImportPattern, "");
      if (!hasReactImport) {
        content = `import React from "react";\n${content}`;
      }
      content = content.replace(/\bReact\d+\b/g, "React");
      await writeFile(distIndexPath, content, "utf8");
    } catch (e) {
      console.warn("postbuild react normalize failed", e);
    }
  },
};

export default defineConfig(config);
