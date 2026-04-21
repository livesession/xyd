import { useCallback, useRef } from 'react'

type Direction = 'horizontal' | 'vertical'

export function useResizable(
  direction: Direction,
  targetRef: React.RefObject<HTMLElement | null>,
  options?: { min?: number; max?: number; invert?: boolean }
) {
  const startPos = useRef(0)
  const startSize = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const el = targetRef.current
      if (!el) return

      const isHorizontal = direction === 'horizontal'
      startPos.current = isHorizontal ? e.clientX : e.clientY
      startSize.current = isHorizontal ? el.offsetWidth : el.offsetHeight

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = isHorizontal
          ? moveEvent.clientX - startPos.current
          : moveEvent.clientY - startPos.current

        const adjustedDelta = options?.invert ? -delta : delta
        let newSize = startSize.current + adjustedDelta

        if (options?.min != null) newSize = Math.max(options.min, newSize)
        if (options?.max != null) newSize = Math.min(options.max, newSize)

        if (isHorizontal) {
          el.style.width = `${newSize}px`
        } else {
          el.style.height = `${newSize}px`
        }

        // Trigger Monaco editor relayout
        window.dispatchEvent(new Event('resize'))
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [direction, targetRef, options?.min, options?.max, options?.invert]
  )

  return { onMouseDown }
}
