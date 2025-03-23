export interface FrontMatter {
    title: string | {
        title: string
        code: string // TODO: in the future mechanism similar to codehike
    }
    group?: string[]
}

export type PageFrontMatter = { [page: string]: FrontMatter }