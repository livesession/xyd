export {
    annotations
} from "./Code"
export type {
    CodeProps
} from "./Code"
export {
    Code,
    CodeLoader,

    highlightAsync,
    highlight
} from "./Code"
//

export type { CodeSampleProps } from "./CodeSample";
export { CodeSample } from "./CodeSample";
//

export type {
    CodeTabsProps
} from "./CodeTabs";
export {
    withCodeTabs
} from "./CodeTabs";
//

export type { CodeThemeProps, CodeThemeBlockProps } from "./CodeTheme";
export {
    CodeTheme,

    useCodeTheme,
    prewarmHighlight
} from "./CodeTheme";

export {
    CoderProvider
} from "./CoderProvider"

// Client highlighter toggle (codehike | rust). The docs-engine calls
// configureCoder({ highlighter }) from settings.engine.highlighter and
// setRustHighlighter(fn) once the Rust WASM highlighter is loaded. Default is
// codehike, so existing sites are unchanged. See
// .ai/client-wasm-highlighter-spike.md.
export {
    configureCoder,
    setRustHighlighter,
    getHighlighterName,
    getRustHighlighter,
    isRustHighlighterActive,
} from "./highlightEngine";
export type {
    HighlighterName,
    RustHighlightFn,
} from "./highlightEngine";;
// The page-wide code language — the API reference's SDK switcher and the
// markdown code groups of different languages share it: the store (one
// localStorage key, seeded from `?lang=`), its hook and the group detection.
export {
    SDK_LANGUAGE_STORAGE_KEY,
    SDK_LANGUAGE_URL_PARAM,
    canonicalSdkLanguage,
    languageGroupTabs,
    languageGroupTab,
    sdkLanguageStore,
    resetSdkLanguageStores,
    useSdkLanguageStore,
} from "./sdkLanguage";
export type { SdkLanguageStore } from "./sdkLanguage";
