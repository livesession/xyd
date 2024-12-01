import React from "react"
import type { ComponentProps } from 'react'
import cn from 'clsx'

export const Th = ({ className = '', ...props }: ComponentProps<'th'>) => (
  <th
    className={cn(
      'm-0 border border-gray-300 px-4 py-2 font-semibold dark:border-gray-600',
      className
    )}
    {...props}
  />
)
