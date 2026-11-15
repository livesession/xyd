// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

// The wrapper is what is under test, not the reference it wraps: the styles
// (compiled at build time), the decorator and the two layouts are stand-ins.
vi.mock("../src/components/Atlas/Atlas.styles", () => ({ AtlasHost: "atlas-host" }));
vi.mock("../src/components/Atlas/AtlasDecorator", () => ({
    AtlasDecorator: ({ children }: { children: React.ReactNode }) => React.createElement("div", { "data-decorator": "" }, children),
}));
vi.mock("../src/components/Atlas/AtlasPrimary", () => ({
    AtlasPrimary: () => React.createElement("p", null, "primary reference"),
}));
vi.mock("../src/components/Atlas/AtlasSecondary", () => ({
    AtlasSecondary: () => React.createElement("p", null, "secondary reference"),
}));
vi.mock("openux-js", () => ({
    UXAnalytics: ({ analytics, children }: { analytics: { track: unknown }; children: React.ReactNode }) =>
        React.createElement("section", { "data-analytics": typeof analytics?.track }, children),
}));

import { Atlas } from "../src/components/Atlas/Atlas";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// The client renderer: it is the one that validates a Fragment's props.
async function render(props: Record<string, unknown>): Promise<string> {
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => {
        root.render(React.createElement(Atlas as any, props));
    });
    const html = host.innerHTML;
    await act(async () => root.unmount());
    return html;
}

describe("Atlas", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders without analytics and gives a Fragment no props it cannot take", async () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});

        const html = await render({ kind: "primary", references: [] });

        expect(html).toContain("primary reference");
        expect(html).not.toContain("data-analytics");
        const messages = errors.mock.calls.map((args) => args.map(String).join(" "));
        expect(messages.filter((m) => m.includes("React.Fragment"))).toEqual([]);
    });

    it("wraps the reference in the analytics provider only when asked to", async () => {
        const html = await render({ kind: "secondary", references: [], analytics: true });

        expect(html).toContain('data-analytics="function"');
        expect(html).toContain("secondary reference");
    });
});
