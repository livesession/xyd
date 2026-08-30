import { describe, it, expect } from "vitest";
import type { Segment } from "@xyd-js/core";

import { resolveActiveLogoTrailingItem } from "../packages/react/utils/segmentLogoTrailing";

const segment: Segment = {
    route: "products",
    title: "HashiCorp",
    appearance: "logoTrailing",
    pages: [
        { title: "Nomad", page: "nomad", icon: "server", color: "#00ca8e" },
        { title: "Nomad Enterprise", page: "nomad-enterprise", icon: "server", color: "#111111" },
        { title: "Consul", page: "consul", icon: "network-wired", color: "#dc477d" },
        { title: "Vault", page: "vault", icon: "lock", color: "#ffcf25" },
    ],
};

describe("resolveActiveLogoTrailingItem", () => {
    it("returns the product whose prefix matches the path, with its color", () => {
        const active = resolveActiveLogoTrailingItem(segment, "/consul/docs/install");
        expect(active?.title).toBe("Consul");
        expect(active?.color).toBe("#dc477d");
    });

    it("matches on the product landing path too", () => {
        expect(resolveActiveLogoTrailingItem(segment, "/vault")?.title).toBe("Vault");
    });

    it("returns null when no product is active (e.g. the landing page)", () => {
        expect(resolveActiveLogoTrailingItem(segment, "/overview")).toBeNull();
        expect(resolveActiveLogoTrailingItem(segment, "/")).toBeNull();
    });

    it("disambiguates overlapping prefixes via findLast (last match wins)", () => {
        // "nomad" prefixes "nomad-enterprise"; both match, findLast picks the
        // one declared later — so the more specific entry must come after.
        const active = resolveActiveLogoTrailingItem(segment, "/nomad-enterprise/docs");
        expect(active?.title).toBe("Nomad Enterprise");
        expect(active?.color).toBe("#111111");
    });

    it("returns the plain product when only its own prefix matches", () => {
        expect(resolveActiveLogoTrailingItem(segment, "/nomad/docs/quickstart")?.title).toBe("Nomad");
    });
});
