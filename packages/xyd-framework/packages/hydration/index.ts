export {
    mapSettingsToProps
} from "./mapSettingsToProps"

// resolveLocaleSettings + override helpers live in a client-safe module
// (./locale). Re-exported from here so server-side callers can keep
// using the `@xyd-js/framework/hydration` import path. The export goes
// directly to ./locale — NOT via ./mapSettingsToProps — so the browser
// bundle that imports just these helpers never pulls in
// mapSettingsToProps (which imports server-only @xyd-js/content).
export {
    resolveLocaleSettings,
    applyOverrides,
    expandDotKeys
} from "./locale"
