import { Metadata, PageLayout } from "@xyd-js/core";

// TODO: in the future it should configurable only via `@metaComponent`
export function pageMetaLayout(meta?: Metadata): PageLayout | undefined {
    switch (meta?.component) {
        case "home":
        case "firstslide":
        case "bloghome":
            return "page"
        default:
            return undefined
    }
}