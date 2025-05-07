export interface OramaCloudConfig {
    endpoint: string

    apiKey: string
}

export interface OramaPluginOptions {
    endpoint?: string

    apiKey?: string

    suggestions?: string[]
}

export interface OramaSectionSchema {
    category: string

    path: string

    title: string

    description: string

    content: string
}
