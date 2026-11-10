import React from "react";
import type { Meta } from "@storybook/react";

import type { Reference } from "@xyd-js/uniform";

import { Atlas } from "@/components/Atlas";
import { AtlasContext } from "@/components/Atlas/AtlasContext";
import widgetReferences from "./widget.references.json";
import labelsReferences from "./labels.references.json";

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

// The rows of a list endpoint and of an object page, as the converter emits
// them for a document whose schemas follow the "object type" convention
// (`object: { enum: [widget] }`): a row typed by a component schema prints that
// schema's label where it would otherwise print `object` —
//   - the response of `listWidgets` is a list whose `data` reads `array of
//     widget`, both the row and its item linked to the widget page
//   - on the slot page, `widget` is a nullable widget (`widget | null`),
//     `material` / `assembly` / `parts` link under their labels (`Material` is a
//     schema without an `object` property, so its label is its name), and the
//     `spare` union lists a `widget` branch beside `string | null`
const LabelsTemplate = () => {
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
        <Atlas kind="primary" references={labelsReferences as unknown as Reference[]} />
      </div>
    </AtlasContext>
  );
};

export const SchemaLabels = LabelsTemplate.bind({});
