import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { Link } from 'react-router'
import * as cn from './Toc.styles'

// TODO: better depth ui

export interface TocProps {
  children: React.ReactNode
  defaultValue?: string
  className?: string
  maxDepth?: number
}

interface TocContextType {
  value: string
  onChange: (v: string) => void
  registerActiveItem: (ref: React.RefObject<HTMLLIElement>, value: string) => void
  unregisterActiveItem: (value: string) => void
}

const Context = createContext<TocContextType>({
  value: '',
  onChange: () => {},
  registerActiveItem: () => {},
  unregisterActiveItem: () => {},
})

export function Toc({ children, defaultValue, className, maxDepth = 2 }: TocProps) {
  const [activeTrackHeight, setActiveTrackHeight] = useState(0)
  const [activeTrackTop, setActiveTrackTop] = useState(0)
  const [value, setValue] = useState(defaultValue || '')

  const activeItemsRef = useRef<Map<string, React.RefObject<HTMLLIElement>>>(new Map())
  const headingsRef = useRef<string[]>([])
  const ignoreScrollRef = useRef(false)

  const registerActiveItem = useCallback(
    (ref: React.RefObject<HTMLLIElement>, id: string) => {
      activeItemsRef.current.set(id, ref)
    },
    []
  )
  const unregisterActiveItem = useCallback((id: string) => {
    activeItemsRef.current.delete(id)
  }, [])

  // Called when user clicks a TOC item
  const handleUserSelect = useCallback((id: string) => {
    setValue(id)
    // temporarily ignore the next scroll event to preserve click selection
    ignoreScrollRef.current = true
  }, [])

  function getScrollElement(): HTMLElement | Window {
    const el = document.querySelector('[part=page-scroll]') as HTMLElement
    return el || window
  }

  function trackHeight() {
    const ref = activeItemsRef.current.get(value)
    if (ref?.current) {
      setActiveTrackHeight(ref.current.offsetHeight)
      setActiveTrackTop(ref.current.offsetTop)
    }
  }

  function updateHeadingsList() {
    const selector = Array.from({ length: maxDepth }, (_, i) => `h${i + 2}`).join(',')
    headingsRef.current = Array.from(document.querySelectorAll(selector)).map(h => h.id)
  }

  useEffect(() => {
    updateHeadingsList()
    if (!defaultValue && headingsRef.current.length) {
      setValue(headingsRef.current[0])
    }
    window.addEventListener('resize', updateHeadingsList)
    return () => window.removeEventListener('resize', updateHeadingsList)
  }, [defaultValue])

  // On scroll, pick active heading unless we're ignoring due to click
  useEffect(() => {
    const scrollEl = getScrollElement()
    function handleScroll() {
      if (ignoreScrollRef.current) {
        ignoreScrollRef.current = false
        return
      }
      const scrollTop = scrollEl instanceof Window ? window.pageYOffset : scrollEl.scrollTop
      const viewportHeight = scrollEl instanceof Window ? window.innerHeight : scrollEl.clientHeight
      const threshold = viewportHeight * 0.2

      let newActive = headingsRef.current[0] || ''
      for (const id of headingsRef.current) {
        const elem = document.getElementById(id)
        if (elem) {
          const top = elem.getBoundingClientRect().top
          if (top <= threshold) {
            newActive = id
          } else {
            break
          }
        }
      }

      const totalHeight = scrollEl instanceof Window
        ? document.documentElement.scrollHeight
        : (scrollEl as HTMLElement).scrollHeight
      // only override for bottom if content is scrollable
      if (totalHeight > viewportHeight && scrollTop + viewportHeight >= totalHeight - 1) {
        newActive = headingsRef.current[headingsRef.current.length - 1] || newActive
      }

      if (newActive !== value) {
        setValue(newActive)
      }
    }

    scrollEl.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [value])

  useEffect(() => {
    trackHeight()
  }, [value])

  return (
    <Context.Provider value={{ value, onChange: handleUserSelect, registerActiveItem, unregisterActiveItem }}>
      <xyd-toc className={`${cn.TocHost} ${className || ''}`}>
        <div part="scroller">
          <div
            part="scroll"
            style={{
              // @ts-ignore
              '--xyd-toc-active-track-height': `${activeTrackHeight}px`,
              '--xyd-toc-active-track-top': `${activeTrackTop}px`,
            } as any}
          />
        </div>
        <ul part="list">{children}</ul>
      </xyd-toc>
    </Context.Provider>
  )
}

export interface TocItemProps {
  children: React.ReactNode
  id: string
  className?: string
  depth?: number
}

Toc.Item = function TocItem({ children, id, className, depth }: TocItemProps) {
  const { value: activeId, onChange, registerActiveItem, unregisterActiveItem } = useContext(Context)
  const itemRef = useRef<HTMLLIElement>(null)
  const active = activeId === id

  useEffect(() => {
    if (active && itemRef.current) {
      registerActiveItem(itemRef, id)
    }
    return () => unregisterActiveItem(id)
  }, [active, id, registerActiveItem, unregisterActiveItem])

  return (
    <xyd-toc-item>
      <li
        ref={itemRef}
        className={`${cn.TocLi} ${className || ''}`}
        data-active={String(active)}
        data-depth={depth}
      >
        <Link
          part="link"
          to=""
          onClick={e => {
            e.preventDefault()
            onChange(id)
            // update URL hash so browser scrolls correctly
            const url = new URL(window.location.href)
            url.hash = id
            history.replaceState(null, '', url.toString())
            document.getElementById(id)?.scrollIntoView()
          }}
        >
          {children}
        </Link>
      </li>
    </xyd-toc-item>
  )
}
