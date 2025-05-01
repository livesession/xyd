import React from 'react';

import * as cn from "./SearchButton.styles";

interface SearchButtonProps {
  onClick?: () => void;
  placeholder?: string;
  shortcuts?: boolean;
}

export function SearchButton({ shortcuts = true, ...props }: SearchButtonProps) {
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
        shortcuts && (
          <span part="keys">
            <kbd part="key">⌘</kbd>
            <kbd part="key">K</kbd>
          </span>
        )
      }
    </xyd-search-button>
  )
}