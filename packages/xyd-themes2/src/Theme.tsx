import * as React from "react"

import { useMetadata, Surfaces } from "@xyd-js/framework/react";
import { type Theme as ThemeSettings } from "@xyd-js/core"

import { ReactContent } from "@xyd-js/components/content";

export abstract class Theme {
  constructor() {
    // TODO: !!!better API for this!!!
    this.settings = globalThis.__xydThemeSettings
    this.surfaces = globalThis.__xydSurfaces
    this.reactContent = globalThis.__xydReactContent
  }

  protected settings: ThemeSettings
  protected readonly reactContent: ReactContent
  protected readonly surfaces: Surfaces

  public abstract Page({ children }: { children: React.ReactNode })
  public abstract Layout({ children }: { children: React.ReactNode })
  public abstract reactContentComponents(): { [component: string]: (props: any) => React.JSX.Element | null }

  protected useHideToc() {
    const meta = useMetadata()

    if (!meta) {
      return false
    }

    switch (meta.layout) {
      case "wide":
        return true
      case "center":
        return true
      default:
        return false
    }
  }

  protected useLayoutSize() {
    const meta = useMetadata()

    if (!meta) {
      return undefined
    }

    switch (meta.layout) {
      case "wide":
        return "large"
      default:
        return undefined
    }
  }
}
