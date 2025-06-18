export interface XDocs {
    route?: string
    
    codeLanguages?: string[]

    sidebarPathStrategy?: "inherit"

    sidebar?: XDocsSidebar[]
}

// TODO: move to core settings like SidebarLite<XDocsSidebar>
export interface XDocsSidebar {
    group: string

    path?: string

    pages: XDocsSidebar[] | XDocsPage[]
}

export interface XDocsPage {
    type: "endpoint" | "object"

    key: string

    path?: string
}
