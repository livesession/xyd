import type {Reference} from "../types";

export interface InspectionHooks {
    get?(property: string, value: any): void
    set?(property: string, oldValue: any, newValue: any): void
    call?(method: string, args: any[], returnValue: any): void
}

export interface PlayPluginContext {
    reference: Reference
    registerHooks(hooks: InspectionHooks): void
    refresh(): void
    subscribe(listener: () => void): () => void
}

export interface PlayPlugin {
    name: string
    setup(context: PlayPluginContext): void
}

export interface PlayOptions {
    plugins?: PlayPlugin[]
}

export interface Infer<T = any> {
    play(options?: PlayOptions): T
    snapshot(): Record<string, any>
    reset(): void
    readonly reference: Reference
}
