import React, { useEffect, useRef } from 'react';

import * as cn from "./SearchButton.styles";

interface SearchButtonProps {
  onClick?: () => void;
  placeholder?: string;
  shortcutKeys?: string[];
}

export function SearchButton({
  shortcutKeys = ['⌘', 'K'],
  ...props
}: SearchButtonProps) {
  useShortcuts(shortcutKeys, () => props.onClick?.());

  useEffect(() => {
    // @ts-ignore - !!! FIX IN THE FUTURE !!! its a fix for loading virtual:Search twice? original and from plugin - check if exists on prod
    window.__UNSAFE_xyd_search_button_inited = true

    return () => {
      // @ts-ignore
      window.__UNSAFE_xyd_search_button_inited = false
    }
  }, [])

  return (
    <xyd-search-button
      className={cn.SearchButton}
      aria-label="Search"
      onClick={props.onClick}
    >
      <span part="container">
        <svg
          width={20}
          height={20}
          part="icon"
          viewBox="0 0 20 20"
        >
          <path
            d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
            stroke="currentColor"
            fill="none"
            fillRule="evenodd"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span part="placeholder">{props.placeholder || "Search"}</span>
      </span>

      {
        shortcutKeys.length > 0 && (
          <span part="keys">
            {shortcutKeys.map((key, index) => (
              <kbd key={index} part="key">{key}</kbd>
            ))}
          </span>
        )
      }
    </xyd-search-button>
  )
}

function useShortcuts(shortcutKeys: string[], onTrigger: () => void): void {
  // Keep latest handler reference to avoid stale closures
  const savedHandler = useRef(onTrigger);

  useEffect(() => {
    savedHandler.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    // @ts-ignore
    if (window.__UNSAFE_xyd_search_button_inited) {
      return
    }

    const listener = (event: KeyboardEvent) => {
      // For single key shortcuts
      if (shortcutKeys.length === 1) {
        if (event.key.toLowerCase() === shortcutKeys[0].toLowerCase()) {
          event.preventDefault();

          savedHandler.current();
        }
        return;
      }

      // For modifier combinations
      if (shortcutKeys.length === 2) {
        const [modifier, key] = shortcutKeys;
        const pressedKey = event.key.toLowerCase();

        const isModifierMatch =
          (modifier === '⌘' && event.metaKey) ||
          (modifier === 'Ctrl' && event.ctrlKey);

        if (isModifierMatch && pressedKey === key.toLowerCase()) {
          event.preventDefault();

          savedHandler.current();
        }
      }
    };

    // Use capture phase and listen to both keydown and keyup
    window.addEventListener('keydown', listener, { capture: true });
    window.addEventListener('keyup', listener, { capture: true });

    return () => {
      window.removeEventListener('keydown', listener, { capture: true });
      window.removeEventListener('keyup', listener, { capture: true });
    };
  }, []);
}