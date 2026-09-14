//! Port of opensdk-core `spec.ts`: loading an OpenSDK IR document and looking
//! things up inside it.
//!
//! ## The IR stays a `Value`
//!
//! `loadOpensdkSpec` is typed `Promise<OpensdkSpecJson | null>`, but that type is
//! a 960-line generated mirror of `opensdk-spec.json` and the Rust side has
//! deliberately never grown one: five emitters read `&serde_json::Value`
//! directly and three different map orderings are already baked into three sets
//! of goldens (see `xyd_opensdk_core`'s lib docs). So the loader hands back a
//! `Value`, which is also what `walk_methods` already takes.
//!
//! That is not only a convenience — it is BEHAVIOURALLY closer. The TS `as
//! OpensdkSpecJson` is an unchecked cast, so `loadOpensdkSpec` on a file
//! containing `42` returns the number `42`. A typed struct would reject it; a
//! `Value` reproduces it (`load-spec/08.non-object-json` pins exactly this).
//!
//! ## HTTP(S) sources are the caller's job
//!
//! The TypeScript accepts `http://` / `https://` sources and `fetch`es them.
//! This crate does NOT, on purpose: it is a dependency-light config leaf, and an
//! HTTP client (reqwest + tokio + rustls) has no business in the dependency
//! graph of every emitter. [`load_opensdk_spec_result`] reports
//! [`LoadSpecError::UnsupportedUrl`] for such a source so the caller can fetch
//! the bytes itself and hand them to [`parse_opensdk_spec`]. This is a REAL
//! divergence, not an oversight — the URL half of `loadOpensdkSpec` is not
//! ported, and no fixture covers it.

use std::path::{Path, PathBuf};

use serde_json::Value;

/// Port of `spec.ts`'s `walkMethods`.
///
/// Not re-implemented here: it was already ported (into `xyd_opensdk_core`,
/// where the emitters needed it), and one implementation is the point.
pub use xyd_opensdk_core::emitter::walk_methods;

/// Options for [`load_opensdk_spec`].
#[derive(Debug, Clone, Default)]
pub struct LoadOpensdkSpecOptions {
    /// Base directory used to resolve a relative file `source`.
    /// Defaults to the process working directory.
    pub cwd: Option<PathBuf>,
}

/// Why a spec could not be loaded.
///
/// The TypeScript collapses all of these into `console.error` + `null`;
/// [`load_opensdk_spec`] reproduces that, and this type is what you use when you
/// want to know WHY.
#[derive(Debug, thiserror::Error)]
pub enum LoadSpecError {
    /// An `http://` / `https://` source. Fetch it in the caller and use
    /// [`parse_opensdk_spec`] — see the module docs.
    #[error("HTTP(S) OpenSDK spec sources are not supported by xyd_opensdk_config: fetch {0} in the caller and use parse_opensdk_spec")]
    UnsupportedUrl(String),
    /// The working directory could not be read (only when no `cwd` was given).
    #[error("resolve the working directory: {0}")]
    Cwd(#[source] std::io::Error),
    /// The file could not be read.
    #[error("read {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    /// The file was read but is not JSON.
    #[error("parse {path}: {source}")]
    Json {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },
}

/// Whether `source` is an HTTP(S) URL, by the same prefix test the TS uses.
fn is_http_source(source: &str) -> bool {
    source.starts_with("http://") || source.starts_with("https://")
}

/// Resolve a file `source` the way `path.resolve(base, source)` does: an
/// absolute source ignores `base`.
fn resolve_source(
    source: &str,
    opts: Option<&LoadOpensdkSpecOptions>,
) -> Result<PathBuf, LoadSpecError> {
    let path = Path::new(source);
    if path.is_absolute() {
        return Ok(path.to_path_buf());
    }
    let base = match opts.and_then(|o| o.cwd.clone()) {
        Some(cwd) => cwd,
        None => std::env::current_dir().map_err(LoadSpecError::Cwd)?,
    };
    Ok(base.join(path))
}

/// Parse an OpenSDK spec from already-read text (`JSON.parse`, no cast).
pub fn parse_opensdk_spec(content: &str) -> Result<Value, serde_json::Error> {
    serde_json::from_str(content)
}

/// Load an OpenSDK spec from a FILE path, reporting why on failure.
///
/// The HTTP(S) half of the TypeScript is not ported — see the module docs.
pub fn load_opensdk_spec_result(
    source: &str,
    opts: Option<&LoadOpensdkSpecOptions>,
) -> Result<Value, LoadSpecError> {
    if is_http_source(source) {
        return Err(LoadSpecError::UnsupportedUrl(source.to_string()));
    }
    let resolved = resolve_source(source, opts)?;
    let content = std::fs::read_to_string(&resolved).map_err(|source| LoadSpecError::Io {
        path: resolved.clone(),
        source,
    })?;
    parse_opensdk_spec(&content).map_err(|source| LoadSpecError::Json {
        path: resolved,
        source,
    })
}

/// Load an OpenSDK spec from a file path. Returns `None` (and logs) on any
/// failure — the exact contract of the TypeScript `loadOpensdkSpec`.
///
/// The log LINE is not byte-compatible with the TS `console.error` (it carries a
/// Rust error chain rather than a JS `Error`); the RETURN VALUE is.
pub fn load_opensdk_spec(source: &str, opts: Option<&LoadOpensdkSpecOptions>) -> Option<Value> {
    match load_opensdk_spec_result(source, opts) {
        Ok(spec) => Some(spec),
        Err(err) => {
            eprintln!("Error loading OpenSDK spec from {source}: {err}");
            None
        }
    }
}

/// Look up a named type in the symbol table — the FIRST match wins, as
/// `Array.prototype.find` does.
///
/// A missing or non-array `types` yields `None`, where the TS would throw on a
/// non-array (`(spec.types || []).find` on an object is a `TypeError`). No real
/// spec has one; the schema types `types` as an array.
pub fn find_type<'a>(spec: &'a Value, name: &str) -> Option<&'a Value> {
    spec.get("types")?
        .as_array()?
        .iter()
        .find(|t| t.get("name").and_then(Value::as_str) == Some(name))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn demo() -> Value {
        json!({
            "opensdk": "1.0.0",
            "info": { "title": "Demo", "version": "1.0.0" },
            "types": [
                { "name": "Pet", "kind": "struct", "fields": [{ "name": "id" }] },
                { "name": "Status", "kind": "enum", "base": "string" }
            ],
            "resources": [{
                "name": "pets",
                "methods": [{ "action": "list", "httpMethod": "get", "path": "/pets" }],
                "resources": [{
                    "name": "tags",
                    "methods": [{ "action": "create", "httpMethod": "post", "path": "/pets/{pet_id}/tags" }]
                }]
            }]
        })
    }

    #[test]
    fn find_type_resolves_by_name() {
        let spec = demo();
        assert_eq!(find_type(&spec, "Status").unwrap()["kind"], json!("enum"));
        assert_eq!(
            find_type(&spec, "Pet").unwrap()["fields"][0]["name"],
            json!("id")
        );
        assert!(find_type(&spec, "Missing").is_none());
        assert!(find_type(&spec, "").is_none());
    }

    #[test]
    fn find_type_returns_the_first_match_and_tolerates_a_missing_table() {
        let dup = json!({ "types": [{ "name": "D", "m": 1 }, { "name": "D", "m": 2 }] });
        assert_eq!(find_type(&dup, "D").unwrap()["m"], json!(1));
        assert!(find_type(&json!({}), "D").is_none());
        // A non-array `types` is a TypeError in TS; here it is simply no match.
        assert!(find_type(&json!({ "types": { "D": {} } }), "D").is_none());
    }

    #[test]
    fn walk_methods_is_the_reexport_and_flattens_pre_order() {
        let spec = demo();
        let keys: Vec<String> = walk_methods(&spec)
            .into_iter()
            .map(|(path, m)| format!("{} {}", path.join("/"), m["action"].as_str().unwrap()))
            .collect();
        assert_eq!(keys, ["pets list", "pets/tags create"]);
    }

    #[test]
    fn http_sources_are_rejected_rather_than_fetched() {
        let err = load_opensdk_spec_result("https://example.com/spec.json", None).unwrap_err();
        assert!(matches!(err, LoadSpecError::UnsupportedUrl(_)), "{err:?}");
        assert!(load_opensdk_spec("http://example.com/spec.json", None).is_none());
    }

    /// The `cwd`-defaults-to-the-process-cwd branch, without mutating the
    /// process cwd (which would race the other tests in this binary): build a
    /// path that is relative TO the current directory and load it with no
    /// options at all.
    #[test]
    fn a_relative_source_with_no_options_resolves_against_the_process_cwd() {
        let cwd = std::env::current_dir().unwrap();
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let absolute = manifest.join("__fixtures__/load-spec/01.relative-to-cwd/spec.json");
        // cargo runs tests with cwd = the package root, so this is just the
        // fixture path made relative again — but compute it rather than assume.
        let relative = absolute
            .strip_prefix(&cwd)
            .expect("test cwd must contain the fixture");
        let loaded = load_opensdk_spec(relative.to_str().unwrap(), None).expect("loads");
        assert_eq!(loaded["info"]["title"], json!("Loaded"));
        // …and an explicit cwd of the same directory is equivalent.
        let opts = LoadOpensdkSpecOptions {
            cwd: Some(cwd.clone()),
        };
        assert_eq!(
            load_opensdk_spec(relative.to_str().unwrap(), Some(&opts)),
            Some(loaded)
        );
    }
}
