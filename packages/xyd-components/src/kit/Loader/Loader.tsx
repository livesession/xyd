import React from "react";
import * as cn from "./Loader.styles";

export interface LoaderProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Loader({ size = "medium", className }: LoaderProps) {
  return (
    <div 
      className={`
        ${cn.LoaderHost}
        ${size === "small" && cn.LoaderSmall}
        ${size === "large" && cn.LoaderLarge}
        ${className}
      `}
    >
      <div className={cn.LoaderDots}>
        <div className={cn.LoaderDot} />
        <div className={cn.LoaderDot} />
        <div className={cn.LoaderDot} />
      </div>
    </div>
  );
} 