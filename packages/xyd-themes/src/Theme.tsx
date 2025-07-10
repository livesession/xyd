import * as React from "react"
import { useMetadata } from "@xyd-js/framework/react"
import { Surfaces } from "@xyd-js/framework"
import type { Theme as ThemeSettings } from "@xyd-js/core"
import { ReactContent } from "@xyd-js/components/content"

// ─── Utility Types ─────────────────────────────────────────────

type Join<K, P> = K extends string
  ? P extends string
  ? `${K}.${P}`
  : never
  : never

type Prev = [never, 0, 1, 2, 3, 4, 5]

type Paths<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
  ? {
    [K in keyof T]-?: K extends string
    ? T[K] extends object
    ? K | Join<K, Paths<T[K], Prev[D]>>
    : K
    : never
  }[keyof T]
  : ""

type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
  ? PathValue<T[K], Rest>
  : never
  : P extends keyof T
  ? T[P]
  : never

type TypedTheme<T> = {
  Set: <P extends Paths<T>>(path: P, value: PathValue<T, P>) => void
} & T

// ─── Theme Class ──────────────────────────────────────────────

export abstract class Theme {
  constructor() {
    this.settings = globalThis.__xydThemeSettings

    const typedTheme: TypedTheme<ThemeSettings> = {
      ...this.settings,
      Set: this.Set.bind(this),
    }

    this.theme = typedTheme
    this.surfaces = globalThis.__xydSurfaces
    this.reactContent = globalThis.__xydReactContent
  }

  protected settings: ThemeSettings
  public theme: TypedTheme<ThemeSettings>
  protected readonly reactContent: ReactContent
  protected readonly surfaces: Surfaces

  public abstract Page({ children }: { children: React.ReactNode }): React.ReactElement
  public abstract Layout({ children }: { children: React.ReactNode }): React.ReactElement
  public abstract reactContentComponents(): { [component: string]: (props: any) => React.JSX.Element | null }

  private Set<P extends Paths<ThemeSettings>>(path: P, value: PathValue<ThemeSettings, P>): void {
    const keys = path.split(".") as string[]
    let current: any = this.settings

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) current[key] = {}
      current = current[key]
    }

    const finalKey = keys[keys.length - 1]
    current[finalKey] = value
  }

  protected useHideToc() {
    const meta = useMetadata()
    return meta?.layout === "wide" || meta?.layout === "center"
  }

  protected useLayoutSize() {
    const meta = useMetadata()
    return meta?.layout === "wide" ? "large" : undefined
  }
}
