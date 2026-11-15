// @vitest-environment happy-dom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The styles are compiled at build time; the drawer's behaviour is what is under test.
vi.mock("../src/layouts/LayoutPrimary/LayoutPrimary.styles", () => ({ LayoutPrimaryHost: "layout-primary" }));

import { LayoutPrimary } from "../src/layouts/LayoutPrimary/LayoutPrimary";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// The phone layout: a hamburger in the header, the sidebar in the drawer, and
// a page whose path is the layout's key.
function Page({ path }: { path: string }) {
    return h(
        LayoutPrimary,
        { scrollKey: path },
        h(LayoutPrimary.Header, { header: h(LayoutPrimary.Hamburger) }),
        h(LayoutPrimary.MobileAside, {
            aside: h(
                "ul",
                null,
                h("li", null, h("a", { href: "/guide" }, "Guide")),
                h("li", null, h("a", { href: "/cli/deploy" }, h("div", { "data-active": "true" }, "deploy"))),
                h("li", null, h("a", { href: "/cli/init" }, "init"))
            ),
        }),
        h("main", null, h("a", { href: "/elsewhere" }, "Elsewhere"))
    );
}

describe("LayoutPrimary's mobile drawer", () => {
    let host: HTMLDivElement;
    let root: Root;

    const drawer = () => host.querySelector<HTMLElement>('[part="mobile-sidebar"]')!;
    const toggle = () => host.querySelector<HTMLButtonElement>('[part="hamburger-button"]')!;
    const link = (href: string) => drawer().querySelector<HTMLAnchorElement>(`a[href="${href}"]`)!;
    const isOpen = () => drawer().getAttribute("data-active") === "true";

    async function render(path: string) {
        await act(async () => root.render(h(Page, { path })));
    }

    async function click(el: Element, init: MouseEventInit = {}) {
        await act(async () => {
            el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
        });
    }

    async function open() {
        await click(toggle());
        expect(isOpen()).toBe(true);
    }

    beforeEach(async () => {
        host = document.createElement("div");
        document.body.appendChild(host);
        root = createRoot(host);
        await render("/cli/deploy");
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        host.remove();
    });

    it("starts closed and inert, so its links are out of the tab order", () => {
        expect(isOpen()).toBe(false);
        expect(drawer().hasAttribute("inert")).toBe(true);
        expect(toggle().getAttribute("aria-expanded")).toBe("false");
        expect(toggle().getAttribute("aria-controls")).toBe(drawer().id);
    });

    it("opens from the hamburger and moves focus onto the current page's link", async () => {
        await open();

        expect(drawer().hasAttribute("inert")).toBe(false);
        expect(toggle().getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(link("/cli/deploy"));
    });

    it("closes on Escape and gives focus back to the hamburger", async () => {
        await open();

        await act(async () => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });

        expect(isOpen()).toBe(false);
        expect(drawer().hasAttribute("inert")).toBe(true);
        expect(document.activeElement).toBe(toggle());
    });

    it("closes when a link in it is tapped, also one a client-side router handles", async () => {
        await open();
        link("/cli/init").addEventListener("click", (event) => event.preventDefault());

        await click(link("/cli/init"));

        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(toggle());
    });

    it("stays open for a modified click, which opens the link elsewhere", async () => {
        await open();

        await click(link("/guide"), { metaKey: true });
        await click(link("/guide"), { ctrlKey: true });

        expect(isOpen()).toBe(true);
    });

    it("closes when the page changes under it", async () => {
        await open();

        await render("/cli/init");

        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(toggle());
    });

    it("leaves focus alone when it closes while focus is elsewhere on the page", async () => {
        await open();
        const elsewhere = host.querySelector<HTMLAnchorElement>('main a[href="/elsewhere"]')!;
        elsewhere.focus();

        await click(toggle());

        expect(isOpen()).toBe(false);
        expect(document.activeElement).toBe(elsewhere);
    });
});
