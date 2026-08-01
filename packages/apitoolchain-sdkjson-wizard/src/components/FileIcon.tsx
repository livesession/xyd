import {
  Icon,
  type IconName,
  LangIcon,
  type LangIconName,
} from "@apitoolchain/design-system";

/** A file-type icon derived from the path: the language's brand logo for source
 * files, else the ecosystem's registry logo / a generic doc icon. Uses the DS
 * icon set. Shared by the file tree and the Changes list. */
export function FileIcon({ path }: { path: string }) {
  const base = (path.split("/").pop() ?? path).toLowerCase();
  const ext = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1) : "";
  const lang: LangIconName | null =
    ext === "ts" || ext === "tsx" || ext === "mts"
      ? "typescript"
      : ext === "go"
        ? "go"
        : ext === "py"
          ? "python"
          : ext === "rb"
            ? "ruby"
            : ext === "java"
              ? "java"
              : ext === "cs"
                ? "csharp"
                : null;
  if (lang) return <LangIcon name={lang} className="size-3.5 shrink-0" />;
  const icon: IconName =
    base === "package.json"
      ? "npm"
      : base === "go.mod" || base === "go.sum"
        ? "goproxy"
        : base === "pyproject.toml"
          ? "pypi"
          : base.endsWith(".gemspec") || base === "gemfile"
            ? "gems"
            : base === "pom.xml"
              ? "maven"
              : base.endsWith(".csproj")
                ? "nuget"
                : "docs";
  return <Icon icon={icon} size={13} className="shrink-0 text-muted" />;
}
