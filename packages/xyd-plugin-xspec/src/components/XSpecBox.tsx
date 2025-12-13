import React from "react";

import type { SpecBoxProps } from "../types";

export function XSpecBox({ type, id, children, source }: SpecBoxProps) {
  const classNames = {
    note: "spec-note",
    todo: "spec-todo",
    example: "spec-example",
    "counter-example": "spec-counter-example",
  };

  const labels = {
    note: "Note",
    todo: "Todo",
    example: "Example",
    "counter-example": "Counter Example",
  };

  return (
    <div id={id} className={classNames[type]} data-source={source}>
      <a href={`#${id}`}>{labels[type]}</a>
      {children}
    </div>
  );
}
