import React, { useState, useMemo, useContext } from "react";
import { UXNode } from "openux-js";

import { Example, ExampleRoot } from "@xyd-js/uniform";
import { CodeSample, type CodeThemeBlockProps } from "@xyd-js/components/coder";

import { CodeExampleButtons } from "@/components/Code";
import {
  AtlasContext,
  useSyntaxHighlight,
} from "@/components/Atlas/AtlasContext";

import * as cn from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
  examples: ExampleRoot;
  /**
   * Also show the example switcher for a single *labelled* example (one whose
   * codeblock has a title). Off by default, so other reference types (e.g. an
   * OpenAPI page with a single response) keep a plain, tab-less sample.
   */
  singleExampleTab?: boolean;
}

export function ApiRefSamples({ examples, singleExampleTab }: ApiRefSamplesProps) {
  const [activeExampleIndices, setActiveExampleIndices] = useState<
    Record<number, number>
  >({});

  const handleExampleChange = (groupIndex: number, exampleIndex: number) => {
    setActiveExampleIndices((prev) => ({
      ...prev,
      [groupIndex]: exampleIndex,
    }));
  };

  return (
    <atlas-apiref-samples className={cn.ApiRefSamplesContainerHost}>
      {examples.groups?.map(({ description, examples: samples }, i) => {
        const activeExampleIndex = activeExampleIndices[i] || 0;
        const activeExample = samples[activeExampleIndex];

        return (
          <CodeSampleItem
            key={i}
            currentExample={activeExample}
            examples={samples}
            name={String(i)}
            description={description}
            singleExampleTab={singleExampleTab}
            onExampleChange={(ex) => {
              const index = samples.findIndex((e) => e === ex);
              handleExampleChange(i, index);
            }}
          />
        );
      })}
    </atlas-apiref-samples>
  );
}

interface CodeSampleItemProps {
  currentExample: Example;
  examples: Example[];
  name: string;
  description?: string;
  singleExampleTab?: boolean;
  onExampleChange: (example: Example) => void;
}

function CodeSampleItem(props: CodeSampleItemProps) {
  const { currentExample, examples, name, description, singleExampleTab, onExampleChange } =
    props;
  const { markdownFormat } = useContext(AtlasContext);
  const syntaxHighlight = useSyntaxHighlight();

  const shouldRenderAllExamples = markdownFormat;

  // example tabs — always for 2+ examples; and, when opted in, for a single
  // *labelled* example (one whose codeblock has a title, e.g. a CLI Tool sample
  // tagged `diagrams`) so it still reads as a tab. Default keeps a lone,
  // unlabelled sample plain (so an OpenAPI single-response page is unchanged).
  const showButtons =
    examples?.length > 1 ||
    (!!singleExampleTab && examples?.length === 1 && !!examples[0]?.codeblock?.title);
  const buttons = showButtons && (
    <CodeExampleButtons
      activeExample={currentExample}
      examples={examples}
      onClick={onExampleChange}
    />
  );

  const singleCodeSample = (
    <UXNode name="APIRefSample" props={currentExample}>
      <CodeSample
        name={name}
        description={description || ""}
        codeblocks={createCodeblocks(currentExample)}
        theme={syntaxHighlight || undefined}
        markdownFormat={markdownFormat}
      />
    </UXNode>
  );

  const allCodeSamples = examples.map((example, index) => (
    <UXNode key={index} name="APIRefSample" props={example}>
      <CodeSample
        name={`${name}-${example.codeblock?.title || index}`}
        description={example.codeblock?.title || description || ""}
        codeblocks={createCodeblocks(example)}
        theme={syntaxHighlight || undefined}
        markdownFormat={markdownFormat}
      />
    </UXNode>
  ));

  return (
    <div key={name} className={cn.ApiRefSamplesGroupHost}>
      {buttons}
      {shouldRenderAllExamples ? allCodeSamples : singleCodeSample}
    </div>
  );
}

// Helper function to create codeblocks from an example
function createCodeblocks(example: Example): CodeThemeBlockProps[] {
  return (
    example?.codeblock?.tabs?.map(
      (tab) =>
        ({
          value: String(tab.code || ""),
          lang: String(tab.language || ""),
          meta: String(tab.context || ""),
          highlighted: tab.highlighted,
        }) as CodeThemeBlockProps
    ) || []
  );
}
