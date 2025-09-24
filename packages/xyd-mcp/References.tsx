import React from "react";
import { renderToString } from "react-dom/server";

import { Atlas, AtlasContext } from "@xyd-js/atlas";

export function References({
  references,
  cssContent = [],
}: {
  references: any[];
  cssContent?: string[];
}) {
  const atlasContent = renderToString(
    <AtlasContext
      value={{
        syntaxHighlight: null,
        markdownFormat: true,
      }}
    >
      <Atlas kind="primary" references={references} analytics />
    </AtlasContext>
  );

  const inlinedCss = cssContent
    .map((css) => `<style>\n${css}\n</style>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${inlinedCss}
</head>
<body>
    ${atlasContent}
</body>
</html>`;
}
