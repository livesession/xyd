import { describe, expect, it } from "vitest";

import type { DefinitionProperty, Reference } from "@xyd-js/uniform";

import {
  resolvePropertySymbol,
  schemaLabel,
} from "../src/components/ApiRef/ApiRefProperties/symbols";
import labelsReferences from "../src/docs/ApiRefProperties/labels.references.json";

// A row typed by a component schema, as the OpenAPI converter emits it: the
// link (`symbolDef`) carries `label` — the schema's constant `object` value,
// else the schema name — and `canonical` when the schema has a page.
function linked(
  label: string,
  extra: Partial<DefinitionProperty> = {},
  canonical: string | undefined = `objects/${label}`
): DefinitionProperty {
  return {
    name: "row",
    type: "object",
    description: "",
    symbolDef: { id: `#/components/schemas/${label}`, canonical, label },
    properties: [{ name: "id", type: "string", description: "" }],
    ...extra,
  };
}

describe("schemaLabel", () => {
  it("is the link's label", () => {
    expect(schemaLabel(linked("widget"))).toBe("widget");
  });

  it("is empty without a link, or for a link without a label", () => {
    expect(schemaLabel({ name: "row", type: "object", description: "" })).toBe("");
    expect(
      schemaLabel({
        name: "row",
        type: "object",
        description: "",
        symbolDef: { id: ["#/components/schemas/A", "#/components/schemas/B"] },
      })
    ).toBe("");
  });
});

describe("resolvePropertySymbol — linked schemas", () => {
  it("prints the label in place of `object`", () => {
    expect(resolvePropertySymbol(linked("widget"))).toBe("widget");
  });

  it("prints the label of a schema without an `object` property — its name", () => {
    expect(resolvePropertySymbol(linked("Material"))).toBe("Material");
  });

  it("prints the label even when the schema has no page (no canonical)", () => {
    expect(resolvePropertySymbol(linked("Tag", {}, undefined))).toBe("Tag");
  });

  it("keeps the primitive type of a scalar schema (a string alias)", () => {
    expect(
      resolvePropertySymbol(linked("WidgetId", { type: "string", properties: undefined }))
    ).toBe("string");
    expect(
      resolvePropertySymbol(
        linked("WidgetId", { type: "string", properties: undefined }, undefined)
      )
    ).toBe("string");
  });

  it("reads `array of <label>` when the items sit in the row's properties", () => {
    const row: DefinitionProperty = {
      name: "parts",
      type: "$$array",
      description: "",
      symbolDef: { id: "#/components/schemas/Part", canonical: "objects/Part", label: "part" },
      properties: [linked("part", { name: "" })],
    };
    expect(resolvePropertySymbol(row)).toBe("array of part");
  });

  it("reads `array of <label>` for an array of a linked schema", () => {
    const items = linked("widget", { name: "" });
    const row: DefinitionProperty = {
      name: "data",
      type: "$$array",
      description: "",
      symbolDef: items.symbolDef,
      ofProperty: items,
    };
    expect(resolvePropertySymbol(row)).toBe("array of widget");
  });

  it("reads `<label> | null` for a nullable linked schema", () => {
    expect(
      resolvePropertySymbol(linked("widget", { meta: [{ name: "nullable", value: "true" }] }))
    ).toBe("widget | null");
  });

  it("keeps an enum's literals ahead of its label", () => {
    const row = linked("Color", {
      type: "$$enum",
      meta: [{ name: "enum-type", value: "string" }],
      properties: [
        { name: "red", type: "string", description: "" },
        { name: "green", type: "string", description: "" },
      ],
      ofProperty: { name: "", type: "string", description: "" },
    });
    expect(resolvePropertySymbol(row)).toBe('"red" | "green"');
  });

  it("names the branches of a choice by their labels", () => {
    const row: DefinitionProperty = {
      name: "spare",
      type: "$$xor",
      description: "",
      properties: [
        linked("widget", { name: "spare" }),
        linked("part", { name: "spare" }),
      ],
    };
    expect(resolvePropertySymbol(row)).toBe("widget or part");
  });

  it("leaves a plain row alone", () => {
    expect(
      resolvePropertySymbol({ name: "id", type: "string", description: "" })
    ).toBe("string");
    expect(
      resolvePropertySymbol({
        name: "plain",
        type: "object",
        description: "",
        properties: [{ name: "id", type: "string", description: "" }],
      })
    ).toBe("object");
  });
});

describe("resolvePropertySymbol — the story's rows", () => {
  const references = labelsReferences as unknown as Reference[];

  function rows(canonical: string, definition: string): DefinitionProperty[] {
    const reference = references.find((r) => r.canonical === canonical);
    const def = reference?.definitions.find((d) => d.title === definition);
    const variant = (def as any)?.variants?.[0];
    return (variant?.properties || def?.properties || []) as DefinitionProperty[];
  }

  const column = (props: DefinitionProperty[], name: string) =>
    resolvePropertySymbol(props.find((p) => p.name === name)!);

  it("the list response: `data` is an `array of widget`, its items `widget`", () => {
    const response = rows("listWidgets", "Response");
    expect(column(response, "object")).toBe('"list"');
    expect(column(response, "data")).toBe("array of widget");
    expect(resolvePropertySymbol(response.find((p) => p.name === "data")!.ofProperty!)).toBe("widget");
  });

  it("the object page: labels, `… | null`, a union's branches", () => {
    const slot = rows("objects/Slot", "Slot");
    expect(column(slot, "object")).toBe('"slot"');
    expect(column(slot, "widget")).toBe("widget | null");

    const widget = slot.find((p) => p.name === "widget")!.properties!;
    expect(column(widget, "material")).toBe("Material");
    expect(column(widget, "shape")).toBe("Shape");
    expect(column(widget, "parts")).toBe("array of part");
    expect(column(widget, "assembly")).toBe("assembly");

    const spare = slot.find((p) => p.name === "spare")!;
    expect(spare.properties!.map(resolvePropertySymbol)).toEqual(["widget", "string | null"]);
  });
});
