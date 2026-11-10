import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Sidebar, SidebarRoute } from "@xyd-js/core";
import type { Reference } from "@xyd-js/uniform";
import { collapseObjectsGroup, deferencedOpenAPI, groupByTagGroups, oapSchemaToReferences } from "@xyd-js/openapi";

import { openapiPreset } from "../src/presets/openapi";
import { UniformPreset } from "../src/presets/uniform";

// The JS (non-fused) path of the uniform resolver. The fused native endpoint is
// mocked away so `uniformResolver` takes the branch that runs the converter in
// JS, pluginNavigation, and then the preset's `navigationFinish` — the pass
// the fused call runs on its own side. pluginNavigation itself is native-only,
// hence the same addon gate as cli-preset.test.ts.
vi.mock("../src/presets/uniform/native", () => ({ fusedNative: null }));

const nativeUnavailable = (() => {
    if (process.env.XYD_NATIVE === "0") return true;
    try {
        const native = createRequire(import.meta.url)("@xyd-js/native");
        return typeof native?.pluginNavigation !== "function";
    } catch {
        return true;
    }
})();

// A neutral document: two tagged operations, one without a tag, three component
// schemas (= three object pages, grouped under the top-level objects group by
// the `grouped` layout).
const DOCUMENT = `
openapi: 3.0.3
info:
  title: Assembly API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
tags:
  - name: widgets
  - name: parts
paths:
  /widgets:
    get:
      operationId: listWidgets
      summary: List widgets
      tags: [widgets]
      responses:
        '200':
          description: The widgets.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Widget'
  /parts:
    get:
      operationId: listParts
      summary: List parts
      tags: [parts]
      responses:
        '200':
          description: The parts.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Part'
  /status:
    get:
      operationId: getStatus
      summary: Get status
      responses:
        '200':
          description: The status.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Status'
components:
  schemas:
    Widget:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
    Part:
      type: object
      properties:
        id:
          type: string
    Status:
      type: object
      properties:
        ok:
          type: boolean
`;

// A neutral document with the two extensions the second finishing pass reads:
// `x-tagGroups` (sections over the top-level groups) and a tag's
// `x-displayName` (the label of every group of that name). Three tags, two of
// them in the "Core" section in the opposite order to the tags, one (`users`)
// in no section and without a display name; two object pages with a resource
// group (= two sub-groups of the objects group), one without.
const TAG_GROUPS_DOCUMENT = `
openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
tags:
  - name: pets
    x-displayName: Pets
  - name: store
    x-displayName: Store
  - name: users
x-tagGroups:
  - name: Core
    tags: [store, pets]
paths:
  /pets:
    get:
      operationId: listPets
      summary: List pets
      tags: [pets]
      responses:
        '200':
          description: The pets.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
  /store/orders:
    post:
      operationId: placeOrder
      summary: Place order
      tags: [store]
      responses:
        '201':
          description: The order.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
  /users:
    get:
      operationId: listUsers
      summary: List users
      tags: [users]
      responses:
        '200':
          description: The users.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Money'
components:
  schemas:
    Pet:
      x-docs:
        group: pets
      type: object
      properties:
        id:
          type: string
    Order:
      x-docs:
        group: store
      type: object
      properties:
        id:
          type: string
    Money:
      type: object
      properties:
        amount:
          type: integer
`;

type GroupEntry = { group?: string | false; collapsed?: boolean; pages?: unknown[]; [key: string]: unknown };

/** The group names directly under an entry (its nested groups, in order). */
function subGroupNames(entry: GroupEntry | undefined): (string | false | undefined)[] {
    return (entry?.pages || [])
        .filter((p) => p && typeof p === "object" && "group" in (p as object))
        .map((p) => (p as GroupEntry).group);
}

/** The generated top-level groups: the resolver mounts them under the route
 *  entry it matched (or the "" route it unshifts for a plain source). */
function generatedGroups(settings: any): GroupEntry[] {
    const sidebar = (settings.navigation?.sidebar || []) as (SidebarRoute | Sidebar)[];
    return sidebar.flatMap((entry) => ("route" in entry ? (entry.pages || []) : [entry])) as GroupEntry[];
}

/** Every entry, nested groups included, carrying a `collapsed` key. */
function collapsedEntries(entries: GroupEntry[]): GroupEntry[] {
    return entries.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const own = "collapsed" in entry ? [entry] : [];
        const nested = Array.isArray(entry.pages)
            ? collapsedEntries(entry.pages.filter((p) => p && typeof p === "object" && "group" in (p as object)) as GroupEntry[])
            : [];
        return [...own, ...nested];
    });
}

async function runPreset(settings: any) {
    const preset = openapiPreset(settings, {});
    for (const pre of preset.preinstall || []) {
        await pre({})(settings, { routes: preset.routes });
    }
}

describe("the converter's navigation finishing passes", () => {
    it("are exported from the @xyd-js/openapi package entry (what the preset imports)", () => {
        expect(typeof collapseObjectsGroup).toBe("function");
        expect(typeof groupByTagGroups).toBe("function");
    });
});

describe.skipIf(nativeUnavailable)("openapi preset → navigationFinish on the JS path", () => {
    let dir: string;
    let prevCwd: string;

    beforeAll(() => {
        prevCwd = process.cwd();
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "openapi-preset-collapsed-"));
        fs.writeFileSync(path.join(dir, "assembly.yaml"), DOCUMENT);
        fs.writeFileSync(path.join(dir, "petstore.yaml"), TAG_GROUPS_DOCUMENT);
        process.chdir(dir);
    });

    afterAll(() => {
        process.chdir(prevCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("flags the top-level objects group `collapsed: true` by default — and nothing else", async () => {
        const settings: any = {
            api: { openapi: "./assembly.yaml" },
            navigation: { sidebar: [] },
        };

        await runPreset(settings);

        const groups = generatedGroups(settings);
        const objects = groups.find((g) => g.group === "Objects");
        expect(objects, JSON.stringify(groups)).toBeDefined();
        expect(objects!.collapsed).toBe(true);
        expect(objects!.pages!.length).toBeGreaterThan(0);

        // the operation groups stay static, the sub-groups inside Objects too
        expect(collapsedEntries(groups)).toEqual([objects]);
        expect(groups.find((g) => g.group !== "Objects" && g.group)?.collapsed).toBeUndefined();
    });

    it("`api.openapi[..].options.objectsCollapsed: false` keeps the flag off", async () => {
        const settings: any = {
            api: { openapi: { source: "./assembly.yaml", route: "docs/api", options: { objectsCollapsed: false } } },
            navigation: { sidebar: [{ route: "docs/api", pages: [] }] },
        };

        await runPreset(settings);

        const groups = generatedGroups(settings);
        const objects = groups.find((g) => g.group === "Objects");
        expect(objects, JSON.stringify(groups)).toBeDefined();
        expect(objects!.collapsed).toBeUndefined();
        expect(collapsedEntries(groups)).toEqual([]);
    });

    it("then groups the top-level groups into the tag groups' sections, labelled with the display names", async () => {
        const settings: any = {
            api: { openapi: "./petstore.yaml" },
            navigation: { sidebar: [] },
        };

        await runPreset(settings);

        const groups = generatedGroups(settings);
        // the section takes the place of its first member; the group in no
        // tag group keeps its place (and its raw name); the objects group is
        // not a tag and stays last
        expect(groups.map((g) => g.group), JSON.stringify(groups)).toEqual(["Core", "users", "Objects"]);

        // the section lists its members in the tag group's order, each one
        // under its display name, each one a nested group of its own pages
        const core = groups[0];
        expect(subGroupNames(core)).toEqual(["Store", "Pets"]);
        expect(core.collapsed).toBeUndefined();

        // the objects group keeps its flag (the first pass ran first, on the
        // raw name) and its resource sub-groups read the display names too
        const objects = groups[2];
        expect(objects.collapsed).toBe(true);
        expect(subGroupNames(objects)).toEqual(["Pets", "Store"]);

        // no other entry carries a flag: the section is a plain header
        expect(collapsedEntries(groups)).toEqual([objects]);
    });

    it("leaves a document without the extensions as the first pass left it", async () => {
        const settings: any = {
            api: { openapi: "./assembly.yaml" },
            navigation: { sidebar: [] },
        };

        await runPreset(settings);

        const groups = generatedGroups(settings);
        expect(groups.map((g) => g.group)).not.toContain("Core");
        expect(groups.find((g) => g.group === "widgets")).toBeDefined();
        expect(groups[groups.length - 1].group).toBe("Objects");
    });

    it("runs over pluginNavigation's sidebar for the source, and its return is what the navigation gets", async () => {
        const calls: { sidebar: Sidebar[]; references: Reference[]; urlPrefix: string; filePath: string }[] = [];

        class ProbePreset extends UniformPreset {
            constructor(settings: any) {
                super("openapi", settings.api.openapi, settings.navigation.sidebar, true);
                this.uniformRefResolver = this.uniformRefResolver.bind(this);
            }

            protected async uniformRefResolver(filePath: string): Promise<Reference[]> {
                return oapSchemaToReferences(await deferencedOpenAPI(filePath));
            }

            protected override navigationFinish(sidebar: Sidebar[], references: Reference[], urlPrefix: string, filePath: string): Sidebar[] {
                calls.push({ sidebar, references, urlPrefix, filePath });
                return sidebar.map((entry) => ({ ...entry, probe: "finished" })) as Sidebar[];
            }

            run(settings: any) {
                return this.urlPrefix("").newUniformPreset()(settings, "openapi");
            }
        }

        const settings: any = {
            api: { openapi: "./assembly.yaml" },
            navigation: { sidebar: [] },
        };
        const preset = new ProbePreset(settings).run(settings);
        for (const pre of preset.preinstall || []) {
            await pre({})(settings, { routes: preset.routes });
        }

        expect(calls).toHaveLength(1);
        const [call] = calls;
        // pluginNavigation's output: the operation groups and the objects group
        expect(call.sidebar.map((g: any) => g.group)).toContain("Objects");
        // the final references of the source — the object pages are in there
        expect(call.references.some((ref) => (ref.context as any)?.componentSchema)).toBe(true);
        expect(call.urlPrefix).toBe("");
        expect(call.filePath).toBe("assembly.yaml");

        // the pass's return replaced the generated sidebar
        const groups = generatedGroups(settings);
        expect(groups.length).toBeGreaterThan(0);
        expect(groups.every((g) => g.probe === "finished")).toBe(true);
    });
});
