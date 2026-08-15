// TypeDoc-free `.tsx` component-reference extractor (in-binary path).
//
// TypeDoc HANGS inside the `bun --compile` binary (its bootstrap FS/i18n layer),
// so `@xyd-js/sources` is dead-stubbed there and `uniform: @components/*.tsx`
// pages render empty. The raw `typescript` compiler API, however, runs fine in
// the binary (proven), so this module reproduces the shape that
// `sourcesToUniformV2` + `uniformToReactUniform` feed to Atlas — a `Reference`
// with a `Props` definition — using only `ts` + `@xyd-js/uniform` types. It is
// bundled into `@xyd-js/content` (never stubbed) and used ONLY when
// `globalThis.__xydCompiledBinary` is set; the node path keeps TypeDoc (richer).
//
// Extraction mirrors `@xyd-js/source-react-runtime`'s proven raw-`ts` logic:
// detect exported `@category Component` functions, resolve the first param's
// props type via the checker, and emit one property row per member
// (name / type string / JSDoc description / required meta). Unions render as the
// plain joined type string (e.g. `"a" | "b"`), exactly as the TypeDoc path does.
import type { Reference, DefinitionProperty } from "@xyd-js/uniform";

export interface TsxExtractOptions {
    regions?: { name: string }[];
}

/** Extract Atlas-ready `Reference[]` from a `.tsx`/`.ts` component file using the
 *  raw TypeScript compiler API (no TypeDoc). */
export async function tsxToReactUniform(
    file: string,
    opts: TsxExtractOptions = {},
): Promise<Reference[]> {
    const tsmod: any = await import("typescript");
    const ts = tsmod.default ?? tsmod;

    // A single-file Program: enough for the checker to resolve the props type
    // (incl. imported React types via the project's node_modules on disk).
    const program = ts.createProgram([file], {
        jsx: ts.JsxEmit.Preserve,
        allowJs: true,
        noEmit: true,
        skipLibCheck: true,
        esModuleInterop: true,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler ?? ts.ModuleResolutionKind.NodeNext,
    });
    const checker = program.getTypeChecker();
    const sf = program.getSourceFile(file);
    if (!sf) return [];

    const regionNames = new Set((opts.regions || []).map((r) => r.name));
    const refs: Reference[] = [];

    ts.forEachChild(sf, (node: any) => {
        const comp = componentFromNode(ts, node);
        if (!comp) return;
        if (regionNames.size && !regionNames.has(comp.name)) return;

        const properties = extractProps(ts, checker, comp.fnNode);
        refs.push({
            title: comp.name,
            canonical: reactCanonical(comp.name),
            description: comp.summary,
            examples: { groups: [] },
            definitions: [
                {
                    title: "Props",
                    meta: [{ name: "type", value: "parameters" }],
                    properties,
                },
            ],
        } as Reference);
    });

    return refs;
}

/** An exported PascalCase function carrying `@category Component`, or null. */
function componentFromNode(
    ts: any,
    node: any,
): { name: string; fnNode: any; summary: string } | null {
    let fnNode: any = null;
    let name = "";
    let jsdocHost: any = node;

    if (ts.isFunctionDeclaration(node) && node.name && isExported(ts, node)) {
        fnNode = node;
        name = node.name.text;
    } else if (ts.isVariableStatement(node) && isExported(ts, node)) {
        const decl = node.declarationList.declarations[0];
        const init = decl?.initializer;
        if (decl && ts.isIdentifier(decl.name) && init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
            fnNode = init;
            name = decl.name.text;
            jsdocHost = node; // JSDoc sits on the statement, not the arrow
        }
    }
    if (!fnNode || !name || !/^[A-Z]/.test(name)) return null;

    const { summary, category } = readJsdoc(ts, jsdocHost);
    if (category !== "Component") return null;
    return { name, fnNode, summary };
}

function isExported(ts: any, node: any): boolean {
    return !!node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword);
}

/** The function's JSDoc summary + its `@category` value. */
function readJsdoc(ts: any, node: any): { summary: string; category: string } {
    let summary = "";
    let category = "";
    const docs = ts.getJSDocCommentsAndTags?.(node) || [];
    for (const d of docs) {
        if (ts.isJSDoc?.(d)) {
            const c = ts.getTextOfJSDocComment?.(d.comment);
            if (c) summary = c;
            for (const tag of d.tags || []) {
                if (tag.tagName?.text === "category") {
                    category = (ts.getTextOfJSDocComment?.(tag.comment) || "").trim();
                }
            }
        }
    }
    return { summary, category };
}

/** Resolve the first param's props type → one row per member. React/builtin
 *  member types render as their plain type string (never expanded). */
function extractProps(ts: any, checker: any, fnNode: any): DefinitionProperty[] {
    const param = fnNode.parameters?.[0];
    if (!param) return [];

    // Prefer the explicit annotation (`({…}: CalloutProps)` or `(props: P)`);
    // fall back to the inferred param type.
    const propsType = param.type ? checker.getTypeAtLocation(param.type) : checker.getTypeAtLocation(param);
    if (!propsType) return [];

    const out: DefinitionProperty[] = [];
    for (const sym of checker.getPropertiesOfType(propsType) || []) {
        const decl = sym.valueDeclaration || sym.declarations?.[0] || param;
        // Prefer the DECLARED type-annotation text (what the author wrote, e.g.
        // "React.ReactNode") — it's resolution-independent, so it survives the
        // binary's single-file Program where imported .d.ts types (React) don't
        // resolve and `typeToString` would degrade to "any". Fall back to the
        // checker only for inferred/unannotated members.
        let typeStr = "any";
        if (decl?.type && typeof decl.type.getText === "function") {
            try {
                typeStr = decl.type.getText().replace(/\s+/g, " ").trim();
            } catch {
                /* keep trying below */
            }
        }
        if (typeStr === "any") {
            try {
                typeStr = checker.typeToString(checker.getTypeOfSymbolAtLocation(sym, decl));
            } catch {
                /* leave "any" */
            }
        }
        const required = !(sym.flags & ts.SymbolFlags.Optional);
        const description = ts.displayPartsToString?.(sym.getDocumentationComment(checker)) || "";
        out.push({
            name: sym.getName(),
            type: typeStr,
            description,
            meta: required ? [{ name: "required", value: "true" }] : [],
        } as DefinitionProperty);
    }
    return out;
}

/** Best-effort canonical, mirroring the react transform (`functions`→`components`). */
function reactCanonical(name: string): string {
    return `components/${name}`;
}
