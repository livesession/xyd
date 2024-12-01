import React from "react"
import cn from 'clsx'
import type { ComponentProps } from 'react'

export const Table = ({
  className = '',
  ...props
}: ComponentProps<'table'>) => (
  <table
    className={cn('block overflow-x-scroll', className)}
    {...props}
  />
)
