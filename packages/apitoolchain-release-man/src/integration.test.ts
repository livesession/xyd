import { describe, expect, it } from "bun:test";
// The bridge dist is imported by RELATIVE PATH (dev-only): release-man stays
// dependency-free, but this test proves IrChange ≡ ReleaseChange end-to-end.
import {
  diffIR,
  openapi2opensdk,
} from "../../apitoolchain-xyd-bridge/dist/index.js";
import { prepareRelease } from "./prepare";
import type { ReleaseChange } from "./types";

function doc(paths: Record<string, unknown>) {
  return {
    openapi: "3.0.0",
    info: { title: "Pets API", version: "1.0.0" },
    paths,
  };
}

const listOp = {
  get: {
    operationId: "listPets",
    responses: { "200": { description: "ok" } },
  },
};

describe("diffIR → prepareRelease (bridge integration)", () => {
  it("an added operation flows through to a non-none bump", () => {
    const baseIr = openapi2opensdk(doc({ "/pets": listOp }));
    const headIr = openapi2opensdk(
      doc({
        "/pets": listOp,
        "/owners": {
          get: {
            operationId: "listOwners",
            responses: { "200": { description: "ok" } },
          },
        },
      }),
    );
    const diff = diffIR(baseIr, headIr);
    const changes = diff.changes as ReleaseChange[];
    expect(changes.length).toBeGreaterThan(0);

    const r = prepareRelease({
      fromVersion: "1.2.0",
      changes,
      apiName: "Pets API",
      language: "go",
      headSpecVersion: "2.0.0",
      baseSpecVersion: "1.0.0",
      date: "2026-07-06",
    });
    expect(r.bump).not.toBe("none");
    expect(r.toVersion).not.toBe("1.2.0");
    expect(r.prBody).toContain("**Bump:**");
  });

  it("identical specs → no changes → none bump", () => {
    const ir = openapi2opensdk(doc({ "/pets": listOp }));
    const changes = diffIR(ir, ir).changes as ReleaseChange[];
    const r = prepareRelease({
      fromVersion: "1.2.0",
      changes,
      apiName: "Pets API",
      language: "go",
      headSpecVersion: "1.0.0",
      baseSpecVersion: "1.0.0",
      date: "2026-07-06",
    });
    expect(r.bump).toBe("none");
    expect(r.toVersion).toBe("1.2.0");
  });
});
