import { useEffect, useRef, useState } from "react";
import { highlightToHtml } from "../highlight";

/**
 * A shiki-backed code viewer that re-highlights when `{code, language}` change.
 * Self-contained (no xyd-components / codehike) so the wizard package stays a
 * clean DS-only dependency. Uses the shared highlighter singleton + cache.
 */
export interface CodePreviewProps {
  code: string;
  /** highlight language id (typescript/go/python/ruby/java/csharp/json/…). */
  language: string;
  /** optional max-height class (default a tall scroll area). */
  className?: string;
}

export function CodePreview({ code, language, className }: CodePreviewProps) {
  const [html, setHtml] = useState("");
  const latest = useRef("");

  useEffect(() => {
    const key = `${language}:${code}`;
    latest.current = key;
    let cancelled = false;
    void highlightToHtml(code, language).then((out) => {
      if (!cancelled && latest.current === key) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const wrap = `atc-code overflow-auto rounded-control border border-line bg-surface-muted p-3 text-[12.5px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:m-0 [&_code]:font-mono ${
    className ?? "max-h-[520px]"
  }`;

  if (!html) {
    return (
      <div className={wrap}>
        <pre className="m-0 whitespace-pre font-mono text-ink">{code}</pre>
      </div>
    );
  }
  // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output of our own generated code
  return <div className={wrap} dangerouslySetInnerHTML={{ __html: html }} />;
}
