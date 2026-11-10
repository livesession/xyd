import { describe, expect, it } from "vitest";

import type { DefinitionProperty } from "@xyd-js/uniform";

import {
  ENUM_INLINE_LIMIT,
  enumInlineSymbol,
  enumLiterals,
  formatLiteral,
  isConstant,
} from "../src/components/ApiRef/ApiRefProperties/literals";

// The rows as the OpenAPI converter emits them: an enum is `$$enum` with one
// child per value, an `enum-type` meta for the base type, and — for a
// single-value enum or a `const` — the `const` meta carrying the literal.
function enumRow(
  values: (string | number | boolean)[],
  enumType?: string,
  extra: DefinitionProperty["meta"] = []
): DefinitionProperty {
  const meta: NonNullable<DefinitionProperty["meta"]> = [
    ...(extra || []),
    { name: "enum-type", value: enumType },
  ];
  if (values.length === 1) {
    meta.push({ name: "const", value: values[0] });
  }
  return {
    name: "row",
    type: "$$enum",
    description: "",
    meta,
    properties: values.map((v) => ({
      name: String(v),
      type: enumType || "string",
      description: "",
      meta: [],
    })),
    ofProperty: { name: "", type: enumType || "", description: "" },
  };
}

describe("atlas enum literals", () => {
  it("formats strings quoted and the other kinds as written", () => {
    expect(formatLiteral("widget", "string")).toBe('"widget"');
    expect(formatLiteral("widget")).toBe('"widget"');
    expect(formatLiteral('say "hi"', "string")).toBe('"say \\"hi\\""');
    expect(formatLiteral(2, "integer")).toBe("2");
    expect(formatLiteral("2", "integer")).toBe("2");
    expect(formatLiteral(true, "boolean")).toBe("true");
    expect(formatLiteral(null)).toBe("null");
    expect(formatLiteral('{"a":1}', "object")).toBe('{"a":1}');
  });

  it("a single-value enum is a constant and prints its literal alone", () => {
    const object = enumRow(["widget"], "string", [
      { name: "required", value: "true" },
    ]);
    expect(isConstant(object)).toBe(true);
    expect(enumLiterals(object)).toEqual(['"widget"']);
    expect(enumInlineSymbol(object)).toBe('"widget"');
  });

  it("a numeric constant stays unquoted", () => {
    const version = enumRow([2], "integer");
    expect(isConstant(version)).toBe(true);
    expect(enumInlineSymbol(version)).toBe("2");
  });

  it("a multi-value enum prints the values inline, in order", () => {
    const status = enumRow(["active", "archived"], "string");
    expect(isConstant(status)).toBe(false);
    expect(enumInlineSymbol(status)).toBe('"active" | "archived"');
    expect(enumInlineSymbol(enumRow([1, 2, 3], "integer"))).toBe("1 | 2 | 3");
  });

  it("collapses past the inline limit to the first values and an ellipsis", () => {
    const values = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const long = enumRow(values, "string");
    expect(enumInlineSymbol(long)).toBe('"a" | "b" | "c" | "d" | "e" | "f" | …');
    expect(enumInlineSymbol(long, values.length)).toBe(
      values.map((v) => `"${v}"`).join(" | ")
    );
    expect(enumInlineSymbol(enumRow(values.slice(0, ENUM_INLINE_LIMIT), "string"))).toBe(
      '"a" | "b" | "c" | "d" | "e" | "f"'
    );
  });

  it("an untyped enum reads its values as strings", () => {
    const untyped = enumRow(["red", "green"]);
    expect(enumInlineSymbol(untyped)).toBe('"red" | "green"');
  });

  it("is empty for anything that is not an enum with values", () => {
    const plain: DefinitionProperty = {
      name: "id",
      type: "string",
      description: "",
      meta: [{ name: "required", value: "true" }],
    };
    expect(isConstant(plain)).toBe(false);
    expect(enumLiterals(plain)).toEqual([]);
    expect(enumInlineSymbol(plain)).toBe("");

    const empty: DefinitionProperty = {
      name: "kind",
      type: "$$enum",
      description: "",
      meta: [{ name: "enum-type", value: "string" }],
      properties: [],
    };
    expect(enumInlineSymbol(empty)).toBe("");
  });
});
