//! The dereference layer — a LAZY mirror of `deferencedOpenAPI` (utils.ts).
//!
//! The JS pipeline materializes an in-place dereferenced (and possibly cyclic)
//! document, stamping `__UNSAFE_refPath` thunks on every dereferenced value AND
//! its parent during the crawl. The Rust port never materializes: the raw doc
//! stays immutable, `resolve()` follows `$ref` chains transparently at access
//! time, and the stamps live in side-maps keyed by NODE ADDRESS — `&Value`
//! addresses are stable for the doc's lifetime and reproduce JS object-identity
//! aliasing exactly ($ref-aliased nodes share one address; inline nodes are
//! unique).
//!
//! A PRE-CRAWL computes all `__UNSAFE_refPath` stamps up front (as the JS deref
//! does, before any conversion), so conversion order can't skew them. The
//! `__internal_getRefPath` stamps (set DURING conversion by oas-core) live in a
//! second, mutable side-map. `__UNSAFE_circular` is only consumed by the JS
//! examples module — no Rust counterpart needed.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

/// A `$ref`-with-siblings site materialized by `preprocess` — carries the
/// stamps the JS deref would have applied (value + parent container).
#[derive(Debug, Clone)]
pub struct MergedStamp {
    /// JSON pointer of the merged node in the PROCESSED doc.
    pub pointer: String,
    pub fragment: String,
}

fn escape_ptr(seg: &str) -> String {
    seg.replace('~', "~0").replace('/', "~1")
}

pub struct DocCtx<'a> {
    pub raw: &'a Value,
    /// `__UNSAFE_refPath` — node address → "#/..." fragment (pre-crawled;
    /// last-write-wins like the JS deref crawl).
    ref_paths: HashMap<usize, String>,
    /// `__internal_getRefPath` — node address → component paths (stamped during
    /// conversion by core.rs, exactly like the TS mutation).
    internal_ref_paths: std::cell::RefCell<HashMap<usize, Vec<String>>>,
}

fn addr(v: &Value) -> usize {
    v as *const Value as usize
}

impl<'a> DocCtx<'a> {
    pub fn new(raw: &'a Value) -> Self {
        Self::with_merged_stamps(raw, &[])
    }

    pub fn with_merged_stamps(raw: &'a Value, merged: &[MergedStamp]) -> Self {
        let mut ctx = DocCtx {
            raw,
            ref_paths: HashMap::new(),
            internal_ref_paths: std::cell::RefCell::new(HashMap::new()),
        };
        ctx.crawl_stamps();
        // Apply the merged-site stamps (value + parent container), mirroring
        // the JS onDereference for $ref-with-siblings nodes.
        for m in merged {
            if let Some(node) = raw.pointer(&m.pointer) {
                ctx.ref_paths.insert(addr(node), m.fragment.clone());
            }
            if let Some(parent_ptr) = m.pointer.rfind('/').map(|i| &m.pointer[..i]) {
                if let Some(parent) = raw.pointer(parent_ptr) {
                    ctx.ref_paths.insert(addr(parent), m.fragment.clone());
                }
            }
        }
        ctx
    }

    /// $refParser v12 sibling semantics (empirically pinned): a PURE `{$ref}`
    /// node dereferences to the SHARED target (object identity preserved), but
    /// `{$ref, ...siblings}` produces a NEW object — siblings first and
    /// winning, target keys filling the rest. Materialize those merged nodes
    /// up-front so they get stable addresses (the stamping model needs them);
    /// pure $refs stay as-is for lazy identity-preserving resolution.
    pub fn preprocess(raw: &Value) -> (Value, Vec<MergedStamp>) {
        fn walk(raw: &Value, node: &Value, ptr: &str, stamps: &mut Vec<MergedStamp>) -> Value {
            match node {
                Value::Object(map) => {
                    let has_ref = map
                        .get("$ref")
                        .and_then(|r| r.as_str())
                        .map(|s| s.starts_with('#'))
                        .unwrap_or(false);
                    if has_ref && map.len() > 1 {
                        // Merge: siblings (minus $ref) first, then target keys
                        // not present in siblings. Target subtree left raw
                        // (inner refs resolve lazily). Record the site so the
                        // JS deref's value+parent __UNSAFE_refPath stamps still
                        // land (the $ref itself is gone post-merge).
                        let frag = map
                            .get("$ref")
                            .and_then(|r| r.as_str())
                            .unwrap_or_default()
                            .to_string();
                        stamps.push(MergedStamp {
                            pointer: ptr.to_string(),
                            fragment: frag.clone(),
                        });
                        let target = raw.pointer(frag.trim_start_matches('#'));
                        let mut out = serde_json::Map::new();
                        for (k, v) in map {
                            if k != "$ref" {
                                let child_ptr = format!("{ptr}/{}", escape_ptr(k));
                                out.insert(k.clone(), walk(raw, v, &child_ptr, stamps));
                            }
                        }
                        if let Some(Value::Object(t)) = target {
                            for (k, v) in t {
                                if !out.contains_key(k) {
                                    out.insert(k.clone(), v.clone());
                                }
                            }
                        }
                        return Value::Object(out);
                    }
                    let mut out = serde_json::Map::with_capacity(map.len());
                    for (k, v) in map {
                        let child_ptr = format!("{ptr}/{}", escape_ptr(k));
                        out.insert(k.clone(), walk(raw, v, &child_ptr, stamps));
                    }
                    Value::Object(out)
                }
                Value::Array(items) => Value::Array(
                    items
                        .iter()
                        .enumerate()
                        .map(|(i, v)| walk(raw, v, &format!("{ptr}/{i}"), stamps))
                        .collect(),
                ),
                other => other.clone(),
            }
        }
        let mut stamps = Vec::new();
        let out = walk(raw, raw, "", &mut stamps);
        (out, stamps)
    }

    /// Follow `$ref` chains to the actual node. Returns the resolved node
    /// (unchanged if not a ref).
    pub fn resolve<'b>(&self, v: &'b Value) -> &'b Value
    where
        'a: 'b,
    {
        let mut cur = v;
        let mut hops = 0;
        while let Some(frag) = ref_fragment(cur) {
            hops += 1;
            if hops > 64 {
                break; // pathological chain — bail like a cycle
            }
            match self.pointer(frag) {
                Some(target) => cur = target,
                None => break,
            }
        }
        cur
    }

    /// The `__UNSAFE_refPath` stamp for a (resolved) node, if any.
    pub fn ref_path(&self, v: &Value) -> Option<&str> {
        self.ref_paths.get(&addr(v)).map(|s| s.as_str())
    }

    pub fn internal_ref_path(&self, v: &Value) -> Option<Vec<String>> {
        self.internal_ref_paths.borrow().get(&addr(v)).cloned()
    }

    pub fn set_internal_ref_path(&self, v: &Value, paths: Vec<String>) {
        self.internal_ref_paths.borrow_mut().insert(addr(v), paths);
    }

    /// Resolve a `#/a/b` fragment against the raw doc (JSON-pointer with the
    /// RFC 6901 unescaping the JS $refParser applies).
    fn pointer(&self, fragment: &str) -> Option<&'a Value> {
        let ptr = fragment.strip_prefix('#')?;
        self.raw.pointer(ptr)
    }

    /// The deref crawl: depth-first over the doc; every `$ref` stamps its
    /// TARGET and its PARENT container with the fragment (utils.ts stamps
    /// `value` and `parent` in onDereference). Crawls INTO targets with a
    /// path-cycle guard (circular refs terminate).
    fn crawl_stamps(&mut self) {
        let mut stack: HashSet<usize> = HashSet::new();
        let raw = self.raw;
        let mut stamps: HashMap<usize, String> = HashMap::new();
        crawl(raw, raw, None, &mut stack, &mut stamps);
        self.ref_paths = stamps;
    }
}

fn ref_fragment(v: &Value) -> Option<&str> {
    v.as_object()?
        .get("$ref")?
        .as_str()
        .filter(|s| s.starts_with('#'))
}

fn crawl<'a>(
    raw: &'a Value,
    node: &'a Value,
    parent: Option<&'a Value>,
    stack: &mut HashSet<usize>,
    stamps: &mut HashMap<usize, String>,
) {
    let id = addr(node);
    if stack.contains(&id) {
        return; // cycle
    }

    match node {
        Value::Object(map) => {
            if let Some(frag) = ref_fragment(node) {
                let frag = frag.to_string();
                if let Some(target) = raw.pointer(frag.strip_prefix('#').unwrap_or_default()) {
                    stamps.insert(addr(target), frag.clone());
                    if let Some(p) = parent {
                        stamps.insert(addr(p), frag.clone());
                    }
                    stack.insert(id);
                    crawl(raw, target, parent, stack, stamps);
                    stack.remove(&id);
                }
                return;
            }
            stack.insert(id);
            for (_k, v) in map {
                crawl(raw, v, Some(node), stack, stamps);
            }
            stack.remove(&id);
        }
        Value::Array(items) => {
            stack.insert(id);
            for v in items {
                // The parent of a $ref inside an array is the array's own
                // parent object in $refParser terms; approximating with the
                // enclosing container matches the fixture-visible behavior.
                crawl(raw, v, parent, stack, stamps);
            }
            stack.remove(&id);
        }
        _ => {}
    }
}
