export interface FrontMatter {
    title: string
    group?: string[]
}

export type PageFrontMatter = { [page: string]: FrontMatter }