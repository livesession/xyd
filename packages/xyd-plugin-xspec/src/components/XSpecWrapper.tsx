import React from "react";

import XSpec from "./XSpec";

export default function XSpecWrapper({children}) {
  return (
    <XSpec>
      <article>{children}</article>
    </XSpec>
  );
}
