import React from "react"
import type { ComponentProps, ReactElement } from 'react'
import cn from 'clsx'

export const Code = ({
  children,
  className,
  ...props
}: ComponentProps<'code'>): ReactElement => {
  const hasLineNumbers = 'data-line-numbers' in props
  return (
    <code
      className={cn(
        'border-black border-opacity-[0.04] bg-opacity-[0.03] bg-black break-words rounded-md border py-0.5 px-[.25em] text-[.9em]',
        'dark:border-white/10 dark:bg-white/10',
        hasLineNumbers && '[counter-reset:line]',
        className
      )}
      // always show code blocks in ltr
      dir="ltr"
      {...props}
    >
      {children}
    </code>
  )
}
