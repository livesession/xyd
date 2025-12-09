import React from "react";

import { Pre, type HighlightedCode } from "codehike/code";

export default function XSpecPre({ ...props }: any) {
  let highlighted: HighlightedCode | null = null;

  if (props.highlighted) {
    if (typeof props.highlighted === "string") {
      try {
        highlighted = JSON.parse(props.highlighted) as any as HighlightedCode;
      } catch (e) {}
    } else {
      highlighted = props.highlighted;
    }
  }

  const preProps = {
    code: highlighted,
  } as any;

  if (typeof props?.attributes === "string") {
    try {
      const attrs = JSON.parse(props?.attributes) as any;

      if (attrs.class) {
        preProps.className = attrs.class;
      }
    } catch (e) {}
  }

  if (highlighted) {
    return <Pre {...preProps} />;
  }

  return null;
}
