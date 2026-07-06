import { LangIcon, type LangIconName } from "@apitoolchain/design-system";
import type { SdkLanguage } from "~/data";

/** The languages our opensdk pipeline can generate (OpenAPI-only), in order. */
export const SDK_LANGS: { value: SdkLanguage; label: string }[] = [
  { value: "node", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "ruby", label: "Ruby" },
  { value: "java", label: "Java" },
  { value: "dotnet", label: "C#" },
];

export const SDK_LANG_LABEL: Record<SdkLanguage, string> = {
  node: "TypeScript",
  python: "Python",
  go: "Go",
  ruby: "Ruby",
  java: "Java",
  dotnet: "C#",
};

/** Which design-system brand logo each SDK language maps to. */
const LANG_ICON: Record<SdkLanguage, LangIconName> = {
  node: "typescript",
  python: "python",
  go: "go",
  ruby: "ruby",
  java: "java",
  dotnet: "csharp",
};

/** Brand logo for an SDK language — delegates to the design-system {@link LangIcon}. */
export function SdkLangIcon({
  language,
  className = "size-5 shrink-0",
}: {
  language: SdkLanguage;
  className?: string;
}) {
  return <LangIcon name={LANG_ICON[language]} className={className} />;
}

/** Targets the pipeline can't generate yet — shown as disabled "coming soon" tiles. */
export const COMING_SOON_LANGS: { label: string; icon: LangIconName }[] = [
  { label: "Scala", icon: "scala" },
  { label: "Kotlin", icon: "kotlin" },
  { label: "Rust", icon: "rust" },
  { label: "PHP", icon: "php" },
  { label: "Swift", icon: "swift" },
  { label: "C++", icon: "cpp" },
  { label: "Dart", icon: "dart" },
];
