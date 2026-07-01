import { describe, expect, it } from "vitest";

import uniform from "../src";
import { pluginNavigation } from "../src/plugins/pluginNavigation";
import type { Reference } from "../src/types";

function ref(title: string, canonical: string, group: string[]): Reference {
    return {
        title,
        canonical,
        description: "",
        definitions: [],
        examples: { groups: [] },
        context: { group },
    } as unknown as Reference;
}

function buildSidebar(refs: Reference[]) {
    const res = uniform(refs, {
        plugins: [pluginNavigation({} as any, { urlPrefix: "" })],
    }) as unknown as { out: { sidebar: any[] } };
    return res.out.sidebar;
}

const pageOf = (p: any): string => (typeof p === "string" ? p : (p.page ?? p.virtual ?? ""));

describe("pluginNavigation", () => {
    it("renders both direct pages and a nested subgroup under the same group", () => {
        // Mirrors the CLI shape: leaf commands sit directly under "Commands",
        // while `components` + `components install` form a nested "components"
        // group inside it — both must survive (no early-return drop).
        const sidebar = buildSidebar([
            ref("dev", "dev", ["Commands"]),
            ref("components", "components", ["Commands", "components"]),
            ref("components install", "components/install", ["Commands", "components"]),
        ]);

        const commands = sidebar.find((s) => s.group === "Commands");
        expect(commands).toBeTruthy();

        // the leaf command is kept as a direct page (not dropped for the subgroup)
        const directPages = commands.pages.filter((p: any) => !p.group).map(pageOf);
        expect(directPages.some((p: string) => p.endsWith("dev"))).toBe(true);

        // the subcommand lives in a nested "components" group inside "Commands"
        const sub = commands.pages.find((p: any) => p.group === "components");
        expect(sub).toBeTruthy();
        const subPages = sub.pages.map(pageOf);
        expect(subPages.some((p: string) => p.endsWith("components"))).toBe(true);
        expect(subPages.some((p: string) => p.endsWith("components/install"))).toBe(true);
    });

    it("keeps single-level groups flat (no regression for openapi/graphql/mcp)", () => {
        const sidebar = buildSidebar([
            ref("GET /users", "get-users", ["Users"]),
            ref("POST /users", "post-users", ["Users"]),
        ]);
        const users = sidebar.find((s) => s.group === "Users");
        expect(users.pages.map(pageOf).sort()).toEqual(["get-users", "post-users"]);
        expect(users.pages.every((p: any) => !p.group)).toBe(true);
    });
});
