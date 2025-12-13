import React from "react";

import type { SpecSectionProps } from "../types";
import { XSpecHeader } from "./XSpecHeader";

export function XSpecSection({
  id,
  secid,
  title,
  headingLevel = "h1",
  dataSource,
  children,
  className,
  indexSpec = false,
}: SpecSectionProps) {
  return (
    <section
      id={id}
      {...({ secid } as any)}
      className={`${className || ''} ${indexSpec ? "spec-index" : ''}`}
    >
      <XSpecHeader
        id={id}
        secid={secid}
        title={title}
        level={headingLevel}
        dataSource={dataSource}
      />
      {children}
    </section>
  );
}

export default XSpecSection


