// Golden generator for the FUSED uniform endpoint (S6+ W3 tail).
// Replicates the slice of plugin-docs' uniformResolver that the Rust
// `xyd_openapi::fused::uniform_oas_pages` fuses: JS conversion → x-docs
// sidebar plugin → pluginNavigation → per-ref {pagePath, region}.
// Regen is explicit only (oracle-freeze rule):
//   XYD_NATIVE=0 bun scripts/build-fused-goldens.ts
// XYD_NATIVE=0 is REQUIRED: the golden must come from the frozen JS impls.
import path from "node:path";
import fs from "node:fs";

if (process.env.XYD_NATIVE !== "0") {
    console.error("run with XYD_NATIVE=0 — goldens must come from the JS impls");
    process.exit(1);
}

const { deferencedOpenAPI, oapSchemaToReferences, uniformPluginXDocsSidebar } = await import("../src/index.ts");
const uniformMod = await import("../../xyd-uniform/src/index.ts");
const { pluginNavigation } = await import("../../xyd-uniform/src/plugins/pluginNavigation.ts");
const uniform = uniformMod.default;

const FIXTURES = path.join(import.meta.dirname, "..", "__fixtures__");
const URL_PREFIX = "docs/api"; // the fixed test prefix the Rust test mirrors

const cases = ["1.basic", "2.more", "3.multiple-responses", "5.xdocs.sidebar", "8.enums"];

for (const name of cases) {
    const input = path.join(FIXTURES, name, "input.yaml");
    const doc = await deferencedOpenAPI(input);
    const refs = oapSchemaToReferences(doc);

    // uniformResolver plugin order for openapi: [xdocs, navigation].
    const res = uniform(refs, {
        plugins: [
            uniformPluginXDocsSidebar,
            pluginNavigation({} as any, { urlPrefix: URL_PREFIX }),
        ],
    }) as any;

    const pages = res.references.map((ref: any) => {
        const byCanonical = path.join(URL_PREFIX, ref.canonical);
        const ctx = ref.context;
        const method = (ctx?.method || "").toUpperCase();
        let region = "";
        if (method && ctx?.path) {
            region = `${method} ${ctx?.path}`;
        } else if (ctx.componentSchema) {
            region = "/components/schemas/" + ctx.componentSchema;
        }
        return { pagePath: byCanonical, region };
    });

    const golden = {
        urlPrefix: URL_PREFIX,
        sidebar: res.out.sidebar,
        pageFrontMatter: res.out.pageFrontMatter,
        pages,
    };
    fs.writeFileSync(
        path.join(FIXTURES, name, "fused.golden.json"),
        JSON.stringify(golden, null, 2),
    );
    console.log(name, "→ fused.golden.json", `(${pages.length} pages)`);
}
