import type { GitHubTreeItem } from "~/services/github"

export interface EditorLoaderData {
    treeItems: GitHubTreeItem[]
    fileContents: Map<string, string>
    initialFile?: string
    totalFiles: number
    loadedFiles: number
    hasMoreFiles: boolean
}
