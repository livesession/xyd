import { describe, expect, it } from "vitest";
import { compileFilters } from "./compile";
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

describe("compileFilters", () => {
  it("empty model → plain select, no params", () => {
    const c = compileFilters(schema, { query: "", rules: [] });
    expect(c.sql).toBe('select * from "apis"');
    expect(c.params).toEqual([]);
  });

  it("multi-value rule → IN, search → LIKE, values only in params", () => {
    const c = compileFilters(schema, {
      query: "abc",
      rules: [{ key: "language", values: ["go", "python"] }],
    });
    expect(c.sql).toContain('"language" in ($1, $2)');
    expect(c.sql).toContain('lower("name") like $3');
    expect(c.params).toEqual(["go", "python", "%abc%"]);
  });

  it("ignores unknown keys and value-less rules", () => {
    const c = compileFilters(schema, {
      query: "",
      rules: [
        { key: "nope", values: ["x"] },
        { key: "namespace", values: [] },
      ],
    });
    expect(c.sql).toBe('select * from "apis"');
    expect(c.params).toEqual([]);
  });

  it("is injection-safe — the raw value never lands in the SQL string", () => {
    const c = compileFilters(schema, {
      query: "'; drop table apis;--",
      rules: [],
    });
    expect(c.sql).not.toContain("drop table");
    expect(c.params).toEqual(["%'; drop table apis;--%"]);
  });

  it("honours an override table", () => {
    const c = compileFilters(
      schema,
      { query: "", rules: [] },
      { table: "sdks" },
    );
    expect(c.sql).toBe('select * from "sdks"');
  });

  it("qualifies columns with an alias + aliases the table", () => {
    const c = compileFilters(
      schema,
      { query: "abc", rules: [{ key: "language", values: ["go", "python"] }] },
      { table: "apis", alias: "filters" },
    );
    expect(c.sql).toContain('from "apis" as "filters"');
    expect(c.sql).toContain('"filters"."language" in ($1, $2)');
    expect(c.sql).toContain('lower("filters"."name") like $3');
    expect(c.params).toEqual(["go", "python", "%abc%"]);
  });
});
