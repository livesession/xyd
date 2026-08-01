import { describe, expect, it } from "vitest";
import { parseQuery, toQuery } from "./query";
import { defineFilterSchema } from "./schema";

const schema = defineFilterSchema({
  table: "apis",
  fields: [
    { key: "namespace", label: "Namespace", column: "namespace", type: "enum" },
    { key: "language", label: "Language", column: "language", type: "enum" },
    {
      key: "name",
      label: "Name",
      column: "name",
      type: "text",
      freeText: true,
    },
  ],
});

describe("toQuery / parseQuery", () => {
  it("inlines values into a self-contained SQL string", () => {
    const q = toQuery(schema, {
      query: "abc",
      rules: [{ key: "language", values: ["go", "python"] }],
    });
    expect(q).toContain(`"language" in ('go', 'python')`);
    expect(q).toContain(`lower("name") like '%abc%'`);
    expect(q).not.toContain("$1");
  });

  it("parses a namespace filter out of a URL query", () => {
    const model = parseQuery(
      schema,
      `select * from apis where namespace in ('livesession')`,
    );
    expect(model.rules).toEqual([
      { key: "namespace", values: ["livesession"] },
    ]);
    expect(model.query).toBe("");
  });

  it("round-trips model → query → model", () => {
    const model = {
      query: "abc",
      rules: [
        { key: "namespace", values: ["acme"] },
        { key: "language", values: ["go", "python"] },
      ],
    };
    const back = parseQuery(schema, toQuery(schema, model));
    expect(back.query).toBe("abc");
    expect(back.rules).toContainEqual({ key: "namespace", values: ["acme"] });
    expect(back.rules).toContainEqual({
      key: "language",
      values: ["go", "python"],
    });
  });

  it("tolerates alias-qualified columns + empty/garbage input", () => {
    const model = parseQuery(
      schema,
      `select * from "apis" as "filters" where "filters"."namespace" in ('acme')`,
    );
    expect(model.rules).toEqual([{ key: "namespace", values: ["acme"] }]);
    expect(parseQuery(schema, "")).toEqual({ query: "", rules: [] });
    expect(parseQuery(schema, null)).toEqual({ query: "", rules: [] });
    expect(parseQuery(schema, "not sql at all")).toEqual({
      query: "",
      rules: [],
    });
  });
});
