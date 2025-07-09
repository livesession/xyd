
// TODO: move to core?
export function pageLink(page: string) {
    if (!page) {
        return ""
    }

    // If it's an external link (starts with http:// or https://), return it as-is
    if (page.startsWith("http://") || page.startsWith("https://")) {
        return page
    }

    return page.startsWith("/") ? page : `/${page}`
}
