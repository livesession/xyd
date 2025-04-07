import type { MDXComponents } from "mdx/types"

import { Pre, RawCode, highlight } from "codehike/code"

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-dark")
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