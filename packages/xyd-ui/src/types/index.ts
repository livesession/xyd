export interface ITOC {
    depth: number
    value: string
    children: ITOC[]
}

export interface IBreadcrumb {
    title: string,
    href: string
}

export interface INavLinks {
    prev?: {
        title: string,
        href: string
    }

    next?: {
        title: string,
        href: string
    }
}

