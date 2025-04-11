import type { MDXComponents } from "mdx/types"

import { Pre, RawCode, highlight } from "codehike/code"

import { DEFAULT_CODE_THEME } from "@/app/const"

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, DEFAULT_CODE_THEME)
  return (
    <Pre
      code={highlighted}
    />
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Code,
  }
}