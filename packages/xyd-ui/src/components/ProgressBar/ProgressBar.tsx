import React from "react";

import * as cn from "./ProgressBar.styles";

export interface ProgressBarProps {
  className?: string;
  isActive?: boolean;
}

export function ProgressBar({ className, isActive = false }: ProgressBarProps) {
  return (
    <div
      data-element="xyd-progressbar"
      data-active={isActive}
      role="progressbar"
      aria-hidden="true"
      aria-label="loading bar"
      className={`${cn.ProgressBarHost} ${className || ""}`}
    >
      <div data-part="item" />
    </div>
  );
}