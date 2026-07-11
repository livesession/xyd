import type { OpenAPIReferenceContext, Reference } from "@xyd-js/uniform";
import { isMap, LineCounter, parseDocument } from "yaml";

/** A reference's context, plus the component-schema name the converter stamps on
 * schema references (`context.componentSchema`; their canonical is
 * `objects/<name>`). */
type RefContext = OpenAPIReferenceContext & { componentSchema?: string };

/**
 * Map each reference's `canonical` to the 1-based START LINE of its definition in
 * the RAW spec text — so the editor can scroll Monaco to the operation OR the
 * component schema the Atlas is currently showing. YAML is a JSON superset, so
 * `yaml`'s document parser + `LineCounter` locates both `paths[path][method]`
 * (operations) and `components.schemas[name]` (objects) in either spec encoding.
 *
 * Best-effort and never throws: a malformed document (mid-edit) yields an
 * empty/partial map, and the caller keeps its last-good render regardless.
 *
 * SERVER-ONLY by convention — imported from `toGroups.server.ts`, so `yaml`
 * never enters the client bundle (the client already ships `js-yaml`).
 */
export function specPositions(
  text: string,
  references: Reference[],
): Record<string, number> {
  const positions: Record<string, number> = {};
  try {
    const lineCounter = new LineCounter();
    const doc = parseDocument(text, { lineCounter });
    const schemasNode = doc.getIn(["components", "schemas"], true);

    // Line of the map entry whose key matches — prefer the KEY's line (the
    // `get:` / `Pet:` line), fall back to its value.
    const pairLine = (
      mapNode: unknown,
      matches: (key: string) => boolean,
    ): number | undefined => {
      if (!isMap(mapNode)) return undefined;
      const pair = mapNode.items.find((p) => matches(String(p.key)));
      const range =
        (pair?.key as { range?: [number, number, number] } | undefined)
          ?.range ??
        (pair?.value as { range?: [number, number, number] } | undefined)
          ?.range;
      return range ? lineCounter.linePos(range[0]).line : undefined;
    };

    for (const ref of references) {
      const ctx = ref.context as RefContext | undefined;
      let line: number | undefined;

      if (ctx?.method && ctx?.path) {
        // Operation → paths[path][method].
        const method = ctx.method.toLowerCase();
        line = pairLine(
          doc.getIn(["paths", ctx.path], true),
          (k) => k.toLowerCase() === method,
        );
      } else {
        // Component schema → components.schemas[name]. The name is stamped on the
        // context and mirrored in the canonical (`objects/<name>`) as a fallback.
        const canon = ref.canonical.replace(/^\//, "");
        const name =
          ctx?.componentSchema ??
          (canon.startsWith("objects/")
            ? canon.slice("objects/".length)
            : undefined);
        if (name) line = pairLine(schemasNode, (k) => k === name);
      }

      if (line != null) positions[ref.canonical] = line;
    }
  } catch {
    // Malformed / mid-edit text — no positions this round.
  }
  return positions;
}
