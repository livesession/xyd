import React, { useState, useEffect, useContext } from "react";
import { Tabs as TabsPrimitive, Select as SelectPrimitive } from "radix-ui"; // TODO: remove and use separation
import { HighlightedCode } from "codehike/code";

import { CodeCopy } from "../CodeCopy";
import * as cn from "./CodeTabs.styles"; // TODO: style by highlighted?
import { SyntaxHighlightedCode } from "../CodeTheme/CodeTheme";
import { useCodeSampleAnalytics } from "../CodeSample/CodeSampleAnalytics";
import { useUXEvents } from "../../uxsdk";
import { CodeContext } from "../CodeSample/CodeSample";
import { Icon, IconProvider } from "../../writer/Icon/Icon";
import {
  CODE_LANG_ICONS,
  CODE_LANG_LABELS,
  resolveCodeLangName,
} from "../langIconSet";

export interface CodeTabsProps {
  description: string;
  highlighted: SyntaxHighlightedCode[];
  className?: string;
  controlByMeta?: boolean; // TODO: BETTER IN THE FUTURE
}

export function withCodeTabs(PreComponent) {
  return function CodeTabs(props: CodeTabsProps) {
    const isSingle = props?.highlighted?.length === 1 && !props.description;
    const defaultValue =
      props.highlighted[0]?.meta || props.highlighted[0]?.lang;
    const [activeTab, setActiveTab] = useState(defaultValue);
    const {markdownFormat} = useContext(CodeContext);

    const codeSampleAnalytics = useCodeSampleAnalytics();
    const ux = useUXEvents();

    // Reset active tab when highlighted prop changes
    useEffect(() => {
      setActiveTab(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
      codeSampleAnalytics.setActiveTab(activeTab);
    }, []);

    function changeTab(value: string) {
      setActiveTab(value);
      codeSampleAnalytics.setActiveTab(value);
      ux.docs.code.tab_change({ tab: value });
    }

    if (props?.highlighted?.length === 0) {
      return null;
    }

    let ContentRoot = TabsPrimitive.Content
    if (markdownFormat) { // TODO: BETTER IN THE FUTURE
        ContentRoot = React.Fragment
    }
    
    return (
      <xyd-codetabs className={`${cn.CodeTabsHost} ${props.className || ""}`}>
        <TabsPrimitive.Root
          part="root"
          data-single={String(isSingle)}
          data-nodescription={!props.description ? "true" : undefined}
          className={`${cn.CodeTabsRoot}`}
          style={props.highlighted[0]?.style}
          value={activeTab}
          onValueChange={changeTab}
        >
          <$LanguageTabSwitcher
            description={props.description}
            highlighted={props.highlighted}
            value={activeTab}
            onValueChange={changeTab}
          />

          {props.highlighted?.map((codeblock, i) => (
            <ContentRoot
              value={codeblock.meta || codeblock.lang}
              key={i}
            >
              <PreComponent
                style={codeblock?.style || codeblock?.style}
                codeblock={codeblock}
              />
            </ContentRoot>
          ))}
        </TabsPrimitive.Root>
      </xyd-codetabs>
    );
  };
}

interface LanguageTabSwitcherProps {
  description: string;
  highlighted: HighlightedCode[];
  value?: string;
  onValueChange?: (value: string) => void;
}

function $LanguageTabSwitcher(props: LanguageTabSwitcherProps) {
  const { renderLanguage, languageSwitcher, languageIcons } =
    useContext(CodeContext);
  const isSingle = props?.highlighted?.length === 1 && !props.description;

  const highlighted = props.highlighted.filter(
    (item, index, self) =>
      index ===
      self.findIndex((t) => (t.meta || t.lang) === (item.meta || item.lang))
  );

  // The label for a language tab/option. Precedence: a consumer `renderLanguage`
  // override → xyd's built-in language icon (when `languageIcons` is on and the
  // language is known) → the raw language name. `withName` adds the pretty name
  // beside the icon (used in the dropdown; tabs stay icon-only).
  const label = (
    lang: string,
    meta?: string,
    withName = false,
  ): React.ReactNode => {
    if (renderLanguage) return renderLanguage(lang, meta);
    if (languageIcons) {
      const canonical = resolveCodeLangName(lang) ?? resolveCodeLangName(meta);
      if (canonical)
        return (
          <$CodeLangIcon
            name={canonical}
            title={meta || lang}
            withName={withName}
          />
        );
    }
    return meta || lang;
  };

  // A dropdown to pick the language (opt-in) instead of the tab row — only
  // when there's more than one language to choose from.
  const asDropdown =
    languageSwitcher === "dropdown" && !isSingle && highlighted.length > 1;

  return (
    <xyd-codetabs-languages
      data-single={String(isSingle)}
      data-dropdown={asDropdown ? "true" : undefined}
      className={`
        ${cn.CodeTabsLanguagesHost}
    `}
    >
      {props.description && (
        <div part="description">
          <div part="description-item">{props.description}</div>
        </div>
      )}

      {asDropdown ? (
        <$LanguageDropdown
          highlighted={highlighted}
          value={props.value}
          onValueChange={props.onValueChange}
          label={(lang, meta) => label(lang, meta, true)}
        />
      ) : (
        <TabsPrimitive.List part="languages-list">
          {highlighted?.map(({ meta, lang }, i) => {
            if (isSingle) {
              return null;
            }
            return (
              <TabsPrimitive.Trigger
                part="language-trigger"
                value={meta || lang}
                key={i}
              >
                {label(lang, meta)}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      )}

      <div part="copy">
        {highlighted?.map((codeblock, i) => (
          <TabsPrimitive.Content
            value={codeblock.meta || codeblock.lang}
            asChild
            key={i}
          >
            <CodeCopy text={codeblock.value} />
          </TabsPrimitive.Content>
        ))}
      </div>
    </xyd-codetabs-languages>
  );
}

interface LanguageDropdownProps {
  highlighted: HighlightedCode[];
  value?: string;
  onValueChange?: (value: string) => void;
  label: (lang: string, meta?: string) => React.ReactNode;
}

// The language switcher rendered as a dropdown. Drives the same active value as
// the tab row (the enclosing Tabs.Root is controlled), so the code panes swap
// exactly as they do for tabs — analytics included (via `onValueChange`).
function $LanguageDropdown(props: LanguageDropdownProps) {
  const current =
    props.highlighted.find((h) => (h.meta || h.lang) === props.value) ||
    props.highlighted[0];

  return (
    <SelectPrimitive.Root value={props.value} onValueChange={props.onValueChange}>
      <SelectPrimitive.Trigger part="language-select-trigger" aria-label="Select language">
        <span part="language-select-value">
          {props.label(current.lang, current.meta)}
        </span>
        <SelectPrimitive.Icon part="language-select-arrow">
          <$ChevronsUpDown />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          part="language-select-content"
          className={cn.LanguageSelectContent}
          position="popper"
          sideOffset={4}
          align="end"
        >
          <SelectPrimitive.Viewport>
            {props.highlighted.map(({ meta, lang }, i) => (
              <SelectPrimitive.Item
                part="language-select-item"
                className={cn.LanguageSelectItem}
                value={meta || lang}
                key={i}
              >
                <SelectPrimitive.ItemText>
                  {props.label(lang, meta)}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function $ChevronsUpDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

// A programming-language icon from xyd's built-in code-language set, drawn via
// xyd's own <Icon> component — the icons live entirely inside the xyd ecosystem
// (no external icon dependency). Brand-coloured; `withName` adds the pretty
// display name beside the icon (the raw id stays as a tooltip).
function $CodeLangIcon({
  name,
  title,
  withName,
}: {
  name: string;
  title?: string;
  withName?: boolean;
}) {
  const entry = CODE_LANG_ICONS[name];
  return (
    <IconProvider value={{ iconSet: CODE_LANG_ICONS }}>
      <span
        part="language-icon"
        className={cn.LangIcon}
        title={title}
        aria-label={title}
      >
        <Icon name={name} size={14} color={entry?.color} />
        {withName && (
          <span part="language-name">{CODE_LANG_LABELS[name] ?? title ?? name}</span>
        )}
      </span>
    </IconProvider>
  );
}
