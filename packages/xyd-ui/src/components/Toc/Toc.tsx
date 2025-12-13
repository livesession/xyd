import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Link } from "react-router";
import * as cn from "./Toc.styles";

// TODO: better depth ui
export interface TocProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
  maxDepth?: number;
}

interface TocContextType {
  value: string;
  onChange: (v: string) => void;
  registerActiveItem: (
    ref: React.RefObject<HTMLLIElement>,
    value: string
  ) => void;
  unregisterActiveItem: (value: string) => void;
  ancestors: string[];
}

const Context = createContext<TocContextType>({
  value: "",
  onChange: () => {},
  registerActiveItem: () => {},
  unregisterActiveItem: () => {},
  ancestors: [],
});

export function Toc({
  children,
  defaultValue,
  className,
  maxDepth = 2,
}: TocProps) {
  const [activeTrackHeight, setActiveTrackHeight] = useState(0);
  const [activeTrackTop, setActiveTrackTop] = useState(0);
  const [value, setValue] = useState(defaultValue || "");
  const [ancestors, setAncestors] = useState<string[]>([]);

  const activeItemsRef = useRef<Map<string, React.RefObject<HTMLLIElement>>>(
    new Map()
  );
  const headingsRef = useRef<Array<{ id: string; depth: number }>>([]);
  const ignoreScrollRef = useRef(false);
  const tocListRef = useRef<HTMLUListElement>(null);

  const registerActiveItem = useCallback(
    (ref: React.RefObject<HTMLLIElement>, id: string) => {
      activeItemsRef.current.set(id, ref);
    },
    []
  );
  const unregisterActiveItem = useCallback((id: string) => {
    activeItemsRef.current.delete(id);
  }, []);

  // Called when user clicks a TOC item
  const handleUserSelect = useCallback((id: string) => {
    setValue(id);
    // temporarily ignore the next scroll event to preserve click selection
    ignoreScrollRef.current = true;
  }, []);

  function getScrollElement(): HTMLElement | Window {
    return window;
  }

  function trackHeight() {
    const ref = activeItemsRef.current.get(value);
    if (ref?.current) {
      setActiveTrackHeight(ref.current.offsetHeight);
      setActiveTrackTop(ref.current.offsetTop);
    }
  }

  function updateHeadingsList() {
    // Build selector for headings h2...h{maxDepth+1}
    const selector = Array.from(
      { length: maxDepth },
      (_, i) => `h${i + 2}`
    ).join(",");
    headingsRef.current = Array.from(document.querySelectorAll(selector)).map(
      (h) => ({
        id: h.id,
        depth: Number(h.tagName.charAt(1)),
      })
    );
  }

  // Initialize headings and default value
  useEffect(() => {
    updateHeadingsList();
    if (!defaultValue && headingsRef.current.length) {
      setValue(headingsRef.current[0].id);
    }
    window.addEventListener("resize", updateHeadingsList);
    return () => window.removeEventListener("resize", updateHeadingsList);
  }, [defaultValue, maxDepth]);

  // On scroll, pick active heading unless we're ignoring due to click
  useEffect(() => {
    const scrollEl = getScrollElement();
    function handleScroll() {
      if (ignoreScrollRef.current) {
        ignoreScrollRef.current = false;
        return;
      }
      const scrollTop =
        scrollEl instanceof Window ? window.pageYOffset : scrollEl.scrollTop;
      const viewportHeight =
        scrollEl instanceof Window ? window.innerHeight : scrollEl.clientHeight;
      const threshold = viewportHeight * 0.2;

      let newActive = headingsRef.current[0]?.id || "";
      for (const { id } of headingsRef.current) {
        const elem = document.getElementById(id);
        if (elem) {
          const top = elem.getBoundingClientRect().top;
          if (top <= threshold) {
            newActive = id;
          } else {
            break;
          }
        }
      }

      const totalHeight =
        scrollEl instanceof Window
          ? document.documentElement.scrollHeight
          : (scrollEl as HTMLElement).scrollHeight;
      // only override for bottom if content is scrollable
      if (
        totalHeight > viewportHeight &&
        scrollTop + viewportHeight >= totalHeight - 1
      ) {
        newActive =
          headingsRef.current[headingsRef.current.length - 1]?.id || newActive;
      }

      if (newActive !== value) {
        setValue(newActive);
      }
    }

    scrollEl.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [value]);

  // Use auto-scroll hook
  useAutoScroll(value, { current: activeItemsRef.current }, tocListRef);

  // Track the active item's track position/height
  useEffect(() => {
    trackHeight();
  }, [value]);

  // Compute ancestor chain whenever `value` changes
  useEffect(() => {
    const items = headingsRef.current;
    const idx = items.findIndex((h) => h.id === value);
    if (idx === -1) {
      setAncestors([]);
      return;
    }
    const chain: string[] = [];
    let currDepth = items[idx].depth;
    for (let i = idx - 1; i >= 0 && currDepth > 2; i--) {
      const { id, depth } = items[i];
      if (depth < currDepth) {
        chain.unshift(id);
        currDepth = depth;
      }
    }
    setAncestors(chain);
  }, [value]);

  return (
    <Context.Provider
      value={{
        value,
        onChange: handleUserSelect,
        registerActiveItem,
        unregisterActiveItem,
        ancestors,
      }}
    >
      <xyd-toc className={`${cn.TocHost} ${className || ""}`}>
        <div part="scroller">
          <div
            part="scroll"
            style={
              {
                // @ts-ignore
                "--xyd-toc-active-track-height": `${activeTrackHeight}px`,
                "--xyd-toc-active-track-top": `${activeTrackTop}px`,
              } as any
            }
          />
        </div>
        <ul part="list" ref={tocListRef}>
          {children}
        </ul>
      </xyd-toc>
    </Context.Provider>
  );
}

export interface TocItemProps {
  children: React.ReactNode;
  id: string;
  className?: string;
  depth?: number;
}

Toc.Item = function TocItem({ children, id, className, depth }: TocItemProps) {
  const {
    value: activeId,
    ancestors,
    onChange,
    registerActiveItem,
    unregisterActiveItem,
  } = useContext(Context);
  const itemRef = useRef<HTMLLIElement>(null);
  const active = activeId === id || ancestors.includes(id);

  useEffect(() => {
    // Always register the item ref, regardless of active state
    if (itemRef.current) {
      registerActiveItem(itemRef as React.RefObject<HTMLLIElement>, id);
    }
    return () => unregisterActiveItem(id);
  }, [id, registerActiveItem, unregisterActiveItem]);

  return (
    <xyd-toc-item>
      <li
        ref={itemRef}
        className={`${cn.TocLi} ${className || ""}`}
        data-active={String(active)}
        data-depth={depth}
      >
        <Link
          part="link"
          to=""
          onClick={(e) => {
            e.preventDefault();
            onChange(id);
            // update URL hash so browser scrolls correctly
            const url = new URL(window.location.href);
            url.hash = id;
            history.replaceState(null, "", url.toString());
            document.getElementById(id)?.scrollIntoView();
          }}
        >
          {children}
        </Link>
      </li>
    </xyd-toc-item>
  );
};

function useAutoScroll(
  value: string,
  activeItemsRef: React.RefObject<Map<string, React.RefObject<HTMLLIElement>>>,
  tocListRef: React.RefObject<HTMLUListElement>
) {
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const activeItemRef = activeItemsRef.current?.get(value);
    if (!activeItemRef?.current || !tocListRef.current) return;

    const activeItem = activeItemRef.current;

    // Find the scrollable ancestor of the TOC list
    let scrollableParent: HTMLElement | null = tocListRef.current.parentElement;
    while (scrollableParent) {
      const overflowY = window.getComputedStyle(scrollableParent).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        break;
      }
      scrollableParent = scrollableParent.parentElement;
    }

    if (!scrollableParent) return;

    // Get positions
    const parentRect = scrollableParent.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const parentScrollTop = scrollableParent.scrollTop;
    const parentHeight = scrollableParent.clientHeight;
    const scrollHeight = scrollableParent.scrollHeight;

    // Check if we can still scroll down
    const maxScroll = scrollHeight - parentHeight;
    const scrollRemaining = maxScroll - parentScrollTop;

    // Use different margins for top vs bottom
    const topMargin = 40;
    const bottomMargin = 300;

    // Check if item is visible within the viewport with some buffer
    const isItemVisible =
      itemRect.top >= parentRect.top - 10 &&
      itemRect.bottom <= parentRect.bottom + 10;

    // Always scroll if item is not visible
    const isCompletelyNotVisible =
      itemRect.bottom < parentRect.top || itemRect.top > parentRect.bottom;

    // Check if item needs better positioning
    const isAbove = itemRect.top < parentRect.top + topMargin;
    const isBelow = itemRect.bottom > parentRect.bottom - bottomMargin;

    // If item is visible and well-positioned, don't scroll
    if (isItemVisible && !isAbove && !isBelow) return;

    // If item is not visible at all, always scroll
    if (!isCompletelyNotVisible && !isAbove && !isBelow) return;

    // Calculate the item's position relative to the scrollable parent
    const itemTop = itemRect.top - parentRect.top + parentScrollTop;

    let targetScroll: number;

    if (isCompletelyNotVisible) {
      // If completely not visible, scroll to show it
      if (itemRect.top > parentRect.bottom) {
        // Item is below - scroll down to show it
        targetScroll = itemTop - topMargin;
      } else {
        // Item is above - scroll up to show it
        targetScroll = itemTop - topMargin;
      }
    } else if (isAbove) {
      targetScroll = itemTop - topMargin;
    } else {
      // Normal case: position with large bottom margin for early triggering
      targetScroll = itemTop - (parentHeight - bottomMargin);
    }

    // Hide scrollbar during auto-scroll
    scrollableParent.style.scrollbarWidth = "none";
    scrollableParent.style.setProperty("-ms-overflow-style", "none");
    const pseudoStyle = document.createElement("style");
    pseudoStyle.id = "toc-hide-scrollbar";
    pseudoStyle.textContent = `
      ${scrollableParent.className ? "." + scrollableParent.className.split(" ").join(".") : "[data-toc-scrolling]"} {
        scrollbar-width: none;
      }
      ${scrollableParent.className ? "." + scrollableParent.className.split(" ").join(".") : "[data-toc-scrolling]"}::-webkit-scrollbar {
        display: none;
      }
    `;
    scrollableParent.setAttribute("data-toc-scrolling", "true");
    if (!document.getElementById("toc-hide-scrollbar")) {
      document.head.appendChild(pseudoStyle);
    }

    scrollableParent.scrollTo({
      top: targetScroll,
      // top: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior: "smooth",
    });

    // Show scrollbar again after scroll completes
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    autoScrollTimeoutRef.current = setTimeout(() => {
      scrollableParent.style.scrollbarWidth = "";
      scrollableParent.style.removeProperty("-ms-overflow-style");
      scrollableParent.removeAttribute("data-toc-scrolling");
      const style = document.getElementById("toc-hide-scrollbar");
      if (style) {
        style.remove();
      }
    }, 500);
  }, [value, activeItemsRef, tocListRef]);
}
