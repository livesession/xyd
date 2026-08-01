import { describe, expect, it } from "vitest";
import { runFilters } from "./run";
import { defineFilterSchema } from "./schema";

interface Api {
  id: string;
  name: string;
  namespace: string;
  status: string;
  language: string[];
}

const schema = defineFilterSchema({
  table: "apis",
  fields: [
    { key: "namespace", label: "Namespace", column: "namespace", type: "enum" },
    { key: "status", label: "Status", column: "status", type: "enum" },
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

const DATA: Api[] = [
  {
    id: "a",
    name: "Payments",
    namespace: "acme",
    status: "ready",
    language: ["go", "python"],
  },
  {
    id: "b",
    name: "Billing",
    namespace: "acme",
    status: "building",
    language: ["node"],
  },
  {
    id: "c",
    name: "Sessions",
    namespace: "livesession",
    status: "ready",
    language: ["go"],
  },
];

const ids = (rows: Api[]) => rows.map((r) => r.id);

describe("runFilters", () => {
  it("empty model returns all rows", () => {
    expect(ids(runFilters(schema, { query: "", rules: [] }, DATA))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("enum rule matches array-valued fields (IN semantics)", () => {
    const out = runFilters(
      schema,
      { query: "", rules: [{ key: "language", values: ["python", "node"] }] },
      DATA,
    );
    expect(ids(out)).toEqual(["a", "b"]);
  });

  it("AND-s multiple rules", () => {
    const out = runFilters(
      schema,
      {
        query: "",
        rules: [
          { key: "namespace", values: ["acme"] },
          { key: "status", values: ["ready"] },
        ],
      },
      DATA,
    );
    expect(ids(out)).toEqual(["a"]);
  });

  it("free-text search is a contains match on freeText fields", () => {
    expect(ids(runFilters(schema, { query: "bill", rules: [] }, DATA))).toEqual(
      ["b"],
    );
  });
});
