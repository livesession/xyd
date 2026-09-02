import { describe, it, expect } from "vitest";

import { isRoutePrefix } from "../packages/react/utils/routePrefix";
import { findActiveNavigationPage } from "../packages/react/utils/segmentSidebarDropdown";

describe("isRoutePrefix", () => {
    it("matches a route and everything under it", () => {
        expect(isRoutePrefix("/sdks/java", "/sdks/java")).toBe(true);
        expect(isRoutePrefix("/sdks/java/install", "/sdks/java")).toBe(true);
    });

    // The bug this exists for: a plain startsWith compares characters, not path
    // segments, so every JavaScript page looked like a Java page.
    it("does not match a route that merely shares a character prefix", () => {
        expect(isRoutePrefix("/sdks/javascript", "/sdks/java")).toBe(false);
        expect(isRoutePrefix("/sdks/javascript/react", "/sdks/java")).toBe(false);
        expect(isRoutePrefix("/api/apidocs", "/api/api")).toBe(false);
    });

    it("treats the root as covering everything", () => {
        expect(isRoutePrefix("/anything/at/all", "/")).toBe(true);
    });

    it("never matches an empty link", () => {
        expect(isRoutePrefix("/sdks/java", "")).toBe(false);
    });
});

describe("findActiveNavigationPage", () => {
    // Declaration order matters: findLast means a later entry wins, so Java
    // being declared after JavaScript is exactly the failing arrangement.
    const pages = [
        { title: "JavaScript", page: "sdks/javascript" },
        { title: "Java", page: "sdks/java" },
    ] as any;

    it("picks JavaScript for a JavaScript page, not Java", () => {
        expect(findActiveNavigationPage(pages, "/sdks/javascript/react")?.title).toBe("JavaScript");
    });

    it("still picks Java for a Java page", () => {
        expect(findActiveNavigationPage(pages, "/sdks/java/install")?.title).toBe("Java");
    });
});
