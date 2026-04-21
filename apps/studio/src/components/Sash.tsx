import type { CSSProperties } from 'react'

interface SashProps {
  direction: 'vertical' | 'horizontal'
  onMouseDown: (e: React.MouseEvent) => void
}

export function Sash({ direction, onMouseDown }: SashProps) {
  const isVertical = direction === 'vertical'

  const style: CSSProperties = {
    flexShrink: 0,
    background: 'transparent',
    zIndex: 100,
    ...(isVertical
      ? { width: 4, cursor: 'col-resize', marginLeft: -2, marginRight: -2 }
      : { height: 4, cursor: 'row-resize', marginTop: -2, marginBottom: -2 }),
  }

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background =
          'var(--vscode-sash-hoverBorder, #007fd4)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    />
  )
}
