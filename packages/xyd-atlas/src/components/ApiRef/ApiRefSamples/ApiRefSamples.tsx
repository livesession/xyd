import { Play } from "lucide-react";
import { UXNode } from "openux-js";
import React, { useState, useMemo, useContext } from "react";

import { Example, ExampleRoot, ReferenceCategory, type Reference } from "@xyd-js/uniform";
import { CodeSample, type CodeThemeBlockProps } from "@xyd-js/components/coder";

import { CodeExampleButtons } from "@/components/Code";
import {
  AtlasContext,
  usePlayground,
  useSdkLanguage,
  useSyntaxHighlight,
} from "@/components/Atlas/AtlasContext";

import * as cn from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
  /** The reference these samples belong to — drives the "run request" play. */
  reference: Reference;
  examples: ExampleRoot;
  /**
   * Also show the example switcher for a single *labelled* example (one whose
   * codeblock has a title). Off by default, so other reference types (e.g. an
   * OpenAPI page with a single response) keep a plain, tab-less sample.
   */
  singleExampleTab?: boolean;
}

export function ApiRefSamples({ reference, examples, singleExampleTab }: ApiRefSamplesProps) {
  const [activeExampleIndices, setActiveExampleIndices] = useState<
    Record<number, number>
  >({});
  const playground = usePlayground();

  const handleExampleChange = (groupIndex: number, exampleIndex: number) => {
    setActiveExampleIndices((prev) => ({
      ...prev,
      [groupIndex]: exampleIndex,
    }));
  };

  // Opt-in "run request" — a play icon rendered right after the copy button in
  // the code toolbar (via CodeSample's `codeActions`). Only when the host wires a
  // playground and this is a REST operation; clicking opens the host's widget.
  const codeActions =
    playground && reference?.category === ReferenceCategory.REST ? (
      <button
        type="button"
        part="run-request"
        aria-label="Run request"
        title="Run request"
        className={cn.ApiRefSamplesPlay}
        onClick={() => playground.onTry(reference)}
      >
        <Play size={16} />
      </button>
    ) : null;

  return (
    <atlas-apiref-samples className={cn.ApiRefSamplesContainerHost}>
      {examples.groups?.map(({ description, examples: samples, kind }, i) => {
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
            // "Run request" only makes sense on REQUEST samples, not response bodies.
            codeActions={kind === "response" ? undefined : codeActions}
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
  codeActions?: React.ReactNode;
  onExampleChange: (example: Example) => void;
}

function CodeSampleItem(props: CodeSampleItemProps) {
  const { currentExample, examples, name, description, singleExampleTab, codeActions, onExampleChange } =
    props;
  const { markdownFormat, codeSample } = useContext(AtlasContext);
  const syntaxHighlight = useSyntaxHighlight();
  // The page-shared language (header signature + type variants + every code
  // sample stay in sync). null outside a SdkLanguageProvider → uncontrolled.
  const sdkLang = useSdkLanguage();

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
        languageSwitcher={codeSample?.languageSwitcher}
        languageIcons={codeSample?.languageIcons}
        renderLanguage={codeSample?.renderLanguage}
        codeActions={codeActions}
        activeLang={sdkLang?.language}
        onLangChange={sdkLang?.setLanguage}
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
        languageSwitcher={codeSample?.languageSwitcher}
        languageIcons={codeSample?.languageIcons}
        renderLanguage={codeSample?.renderLanguage}
        codeActions={codeActions}
        activeLang={sdkLang?.language}
        onLangChange={sdkLang?.setLanguage}
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
