import React from "react";
import {$loader} from "./Loader.styles.tsx";

export interface LoaderProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Loader({ size = "medium", className }: LoaderProps) {
  return (
    <div 
      className={`
        ${$loader.host}
        ${size === "small" && $loader.$$small}
        ${size === "large" && $loader.$$large}
        ${className}
      `}
    >
      <div className={$loader.dots}>
        <div className={$loader.dot} />
        <div className={$loader.dot} />
        <div className={$loader.dot} />
      </div>
    </div>
  );
} 