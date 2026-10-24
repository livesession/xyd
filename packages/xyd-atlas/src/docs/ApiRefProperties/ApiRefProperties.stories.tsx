import React from "react";
import type { Meta } from "@storybook/react";

import type { Reference } from "@xyd-js/uniform";

import { Atlas } from "@/components/Atlas";
import { AtlasContext } from "@/components/Atlas/AtlasContext";
import widgetReferences from "./widget.references.json";

// The property rows of an object page, as the OpenAPI converter emits them for
// the `9.schema-links` fixture, plus a long enum and a nullable numeric enum:
//   - `object` / `kind` carry the `const` meta → the literal in the type column,
//     no "Show possible types" toggle
//   - `color` / `shade` are enums linked to their schema's page → `"red" |
//     "green" | "blue"` as a link, the values behind the toggle
//   - `definition` / `parts` / `assembly` link to their schema's page and keep
//     their attributes behind "Show properties"
//   - `weekday` has seven values → the first six and `…`
//   - `priority` is `1 | 2 | 3 | null`; `sizes` is `array of "small" | "large" | null`
export default {
  title: "Atlas/ApiRefProperties",
  component: Atlas,
} as Meta;

const Template = () => {
  return (
    <AtlasContext value={{ syntaxHighlight: null, baseMatch: "" }}>
      <div
        style={{
          width: "1200px",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          margin: "0 auto",
        }}
      >
        <Atlas kind="primary" references={widgetReferences as unknown as Reference[]} />
      </div>
    </AtlasContext>
  );
};

export const ConstantsEnumsAndSchemaLinks = Template.bind({});
