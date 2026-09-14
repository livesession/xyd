//! Port of `busybox.ts` — the optional error-handling helper pack shipped in the
//! generated Node SDK.
//!
//! ONE definition (`src/busybox.ts`), exposed three ways:
//!   - `static`    — static members on the client class
//!   - `flat`      — flat named exports from the package root
//!   - `namespace` — a single named namespace object (the default)
//!
//! Off by default: with no `busybox` option nothing here runs and no file is
//! emitted, so every committed golden is untouched.

use serde_json::Value;

/// A resolved busybox config: a concrete style + the namespace export name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedBusybox {
    pub style: BusyboxStyle,
    /// The `namespace`-style export name (default `busybox`); unused otherwise.
    pub name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BusyboxStyle {
    Static,
    Flat,
    Namespace,
}

impl BusyboxStyle {
    fn parse(s: &str) -> Option<Self> {
        match s {
            "static" => Some(Self::Static),
            "flat" => Some(Self::Flat),
            "namespace" => Some(Self::Namespace),
            _ => None,
        }
    }
}

/// The PUBLIC helper names, in declaration order. Shared by every exposure style
/// so the variants stay in lockstep.
pub const BUSYBOX_EXPORTS: &[&str] = &[
    "isAPIError",
    "isStatus",
    "isNotFound",
    "isUnauthorized",
    "isForbidden",
    "isConflict",
    "isRateLimited",
    "isServerError",
    "errMessage",
    "apiErrMessage",
];

/// Normalize the `busybox` option into a concrete config, or `None` when off.
///
/// Mirrors `resolveBusybox`'s union handling exactly:
///   - falsy (absent / `false`)     → None
///   - `true`                       → namespace style, name `busybox`
///   - a style string               → that style, name `busybox`
///   - an object                    → `style ?? 'namespace'`, `name?.trim() || 'busybox'`
///
/// An unrecognized style STRING falls back to the default rather than erroring,
/// matching the TS, which is unchecked at runtime.
pub fn resolve_busybox(option: Option<&Value>) -> Option<ResolvedBusybox> {
    let option = option?;
    match option {
        Value::Bool(false) | Value::Null => None,
        Value::Bool(true) => Some(ResolvedBusybox {
            style: BusyboxStyle::Namespace,
            name: "busybox".to_string(),
        }),
        Value::String(s) => Some(ResolvedBusybox {
            style: BusyboxStyle::parse(s).unwrap_or(BusyboxStyle::Namespace),
            name: "busybox".to_string(),
        }),
        Value::Object(o) => {
            let style = o
                .get("style")
                .and_then(|v| v.as_str())
                .and_then(BusyboxStyle::parse)
                .unwrap_or(BusyboxStyle::Namespace);
            // `name?.trim() || 'busybox'` — an all-whitespace name falls back.
            let name = o
                .get("name")
                .and_then(|v| v.as_str())
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .unwrap_or("busybox")
                .to_string();
            Some(ResolvedBusybox { style, name })
        }
        // Any other JSON value is truthy in JS except 0/""; those are not valid
        // busybox inputs, so treat them as off rather than guessing.
        _ => None,
    }
}

/// `src/busybox.ts` — error helpers built on the SDK's `APIError`.
pub fn render_busybox_file() -> String {
    r#"import { APIError } from './core/error';

/** True when `err` is an APIError (a non-2xx API response), narrowing the type. */
export function isAPIError(err: unknown): err is APIError {
  return err instanceof APIError;
}

/** True when `err` is an APIError carrying the given HTTP status. */
export function isStatus(err: unknown, status: number): boolean {
  return err instanceof APIError && err.status === status;
}

/** True when `err` is a 404 Not Found API response. */
export function isNotFound(err: unknown): boolean {
  return isStatus(err, 404);
}

/** True when `err` is a 401 Unauthorized API response. */
export function isUnauthorized(err: unknown): boolean {
  return isStatus(err, 401);
}

/** True when `err` is a 403 Forbidden API response. */
export function isForbidden(err: unknown): boolean {
  return isStatus(err, 403);
}

/** True when `err` is a 409 Conflict API response. */
export function isConflict(err: unknown): boolean {
  return isStatus(err, 409);
}

/** True when `err` is a 429 Too Many Requests API response. */
export function isRateLimited(err: unknown): boolean {
  return isStatus(err, 429);
}

/** True when `err` is a 5xx server-side API response. */
export function isServerError(err: unknown): boolean {
  return err instanceof APIError && err.status >= 500;
}

/** A human message for ANY thrown value: an Error's `message`, else `String(err)`. */
export function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Prefer the API's real `message` (carried in the JSON body of an APIError) over
 * the generic "failed with status N"; falls back to {@link errMessage} otherwise. */
export function apiErrMessage(err: unknown): string {
  if (err instanceof APIError) {
    try {
      const body = JSON.parse(err.body) as { message?: string };
      if (body?.message) return body.message;
    } catch {
      // body wasn't JSON — fall through to the SDK's message
    }
    return err.message;
  }
  return errMessage(err);
}
"#
    .to_string()
}

/// The `src/index.ts` re-export line, or `None` for the `static` style (whose
/// helpers live on the client class, not the package root).
pub fn busybox_index_export(busybox: &ResolvedBusybox) -> Option<String> {
    match busybox.style {
        BusyboxStyle::Flat => Some(format!(
            "export {{ {} }} from './busybox';",
            BUSYBOX_EXPORTS.join(", ")
        )),
        BusyboxStyle::Namespace => Some(format!("export * as {} from './busybox';", busybox.name)),
        BusyboxStyle::Static => None,
    }
}

/// The client-class contribution for the `static` style: the busybox import plus
/// the `static <name> = busybox.<name>;` alias lines. `None` for other styles.
pub fn busybox_client_statics(busybox: &ResolvedBusybox) -> Option<(String, Vec<String>)> {
    if busybox.style != BusyboxStyle::Static {
        return None;
    }
    Some((
        "import * as busybox from './busybox';".to_string(),
        BUSYBOX_EXPORTS
            .iter()
            .map(|n| format!("  static {n} = busybox.{n};"))
            .collect(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn absent_or_false_is_off() {
        assert!(resolve_busybox(None).is_none());
        assert!(resolve_busybox(Some(&json!(false))).is_none());
        assert!(resolve_busybox(Some(&Value::Null)).is_none());
    }

    #[test]
    fn true_means_the_namespace_default() {
        let b = resolve_busybox(Some(&json!(true))).unwrap();
        assert_eq!(b.style, BusyboxStyle::Namespace);
        assert_eq!(b.name, "busybox");
    }

    #[test]
    fn a_style_string_selects_the_style() {
        for (s, want) in [
            ("static", BusyboxStyle::Static),
            ("flat", BusyboxStyle::Flat),
            ("namespace", BusyboxStyle::Namespace),
        ] {
            assert_eq!(resolve_busybox(Some(&json!(s))).unwrap().style, want);
        }
        // Unrecognized falls back rather than erroring, matching the unchecked TS.
        assert_eq!(
            resolve_busybox(Some(&json!("bogus"))).unwrap().style,
            BusyboxStyle::Namespace
        );
    }

    #[test]
    fn the_object_form_honors_style_and_name() {
        let b = resolve_busybox(Some(&json!({"style": "flat"}))).unwrap();
        assert_eq!(b.style, BusyboxStyle::Flat);
        assert_eq!(b.name, "busybox");

        let b = resolve_busybox(Some(&json!({"name": "apiutils"}))).unwrap();
        assert_eq!(b.style, BusyboxStyle::Namespace);
        assert_eq!(b.name, "apiutils");

        // `name?.trim() || 'busybox'` — whitespace-only falls back.
        let b = resolve_busybox(Some(&json!({"name": "   "}))).unwrap();
        assert_eq!(b.name, "busybox");
        let b = resolve_busybox(Some(&json!({"name": "  spaced  "}))).unwrap();
        assert_eq!(b.name, "spaced");
    }

    #[test]
    fn each_style_exposes_the_helpers_its_own_way() {
        let flat = ResolvedBusybox {
            style: BusyboxStyle::Flat,
            name: "busybox".into(),
        };
        let line = busybox_index_export(&flat).unwrap();
        assert!(line.starts_with("export { isAPIError, isStatus,"));
        assert!(line.ends_with("} from './busybox';"));
        assert!(busybox_client_statics(&flat).is_none());

        let ns = ResolvedBusybox {
            style: BusyboxStyle::Namespace,
            name: "apiutils".into(),
        };
        assert_eq!(
            busybox_index_export(&ns).unwrap(),
            "export * as apiutils from './busybox';"
        );

        let st = ResolvedBusybox {
            style: BusyboxStyle::Static,
            name: "busybox".into(),
        };
        // static helpers are NOT re-exported from the package root.
        assert!(busybox_index_export(&st).is_none());
        let (import, statics) = busybox_client_statics(&st).unwrap();
        assert_eq!(import, "import * as busybox from './busybox';");
        assert_eq!(statics.len(), BUSYBOX_EXPORTS.len());
        assert_eq!(statics[0], "  static isAPIError = busybox.isAPIError;");
    }
}
