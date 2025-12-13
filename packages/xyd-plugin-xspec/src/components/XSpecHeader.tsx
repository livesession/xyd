import React from "react";

import type { SpecHeaderProps } from "../types";

export function XSpecHeader({
  id,
  secid,
  title,
  level = "h1",
  dataSource,
}: SpecHeaderProps) {
  const HeadingTag = level;

  return (
    <HeadingTag data-source={dataSource}>
      <span className="spec-secid" title="link to this section">
        <a href={`#${id}`}>{secid}</a>
      </span>
      {title}
    </HeadingTag>
  );
}
