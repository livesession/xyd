//! Regen-safe project write lifecycle — faithful Rust port of
//! `packages/xyd-opensdk-framework/src/write.ts` (`writeProject`,
//! `materializeProject`, and the `.sdkignore` / manifest / merge helpers).
//!
//! Byte-for-byte compatible with the TS pipeline that produced the committed
//! generated trees: sha256(hex) over UTF-8 content, deterministic sorted
//! processing order, and a `.sdk/sdk.lock` serialized exactly as
//! `JSON.stringify({schemaVersion,generator,files}, null, 2) + "\n"` with sorted
//! keys hashing the PRISTINE generated content.

use std::collections::{BTreeMap, HashSet};
use std::fs;
use std::io;
use std::path::Path;

use regex::Regex;
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::merge::{is_probably_binary, merge3, Merge3Labels, Merge3Options};

/// The regen lock `writeProject` leaves under `.sdk/sdk.lock`: rel path -> sha256
/// of the pristine generated content, so the next run can prune stale files safely.
/// Deliberately timestamp-free so a no-change regen is git-diff clean.
pub const SDK_LOCK_FILENAME: &str = ".sdk/sdk.lock";

/// A user-authored, gitignore-style ignore file at the SDK root. Any generated
/// path it matches is USER-OWNED: never overwritten or pruned (only bootstrapped
/// if missing); a generated-vs-on-disk difference is reported in `conflicts`.
pub const SDK_IGNORE_FILENAME: &str = ".sdkignore";

/// Directory of content-addressed BASE snapshots (`.sdk/base/<sha256>`) — the
/// 3-way-merge ancestor written only when `{ merge: true }`.
pub const SDK_BASE_DIR: &str = ".sdk/base";

/// Manifest schema version. Bump when the format changes incompatibly.
pub const MANIFEST_SCHEMA_VERSION: u64 = 1;

/// How `write_project` treats a generated file that already exists on disk.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum WriteMode {
    /// Replace it (identical bytes are a no-op, so mtimes stay stable).
    Overwrite,
    /// User-owned scaffold (README, Cargo.toml): never clobber an existing file.
    SkipIfExists,
    /// Deep-merge the generated JSON INTO the existing file's JSON (existing user
    /// keys win; arrays replace as a unit, never element-merge).
    MergeJson,
}

/// One generated file: its content and per-file write semantics.
#[derive(Clone)]
pub struct FileEntry {
    pub content: String,
    pub write_mode: WriteMode,
}

/// The virtual project file map. Insertion-ordered like the JS `ProjectFileMap`
/// (`Vec<(rel, entry)>`); duplicate paths would collide (opencli2rust never emits any).
pub type FileMap = Vec<(String, FileEntry)>;

/// The `.sdk/sdk.lock` manifest. Serialized with `schemaVersion`/`generator`/`files`
/// field order (matching `JSON.stringify`); `files` is a sorted `BTreeMap`.
#[derive(Debug, Clone, Serialize)]
pub struct ProjectManifest {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u64,
    pub generator: String,
    /// Sorted rel path -> sha256 hex of the pristine generated content.
    pub files: BTreeMap<String, String>,
}

#[derive(Clone, Default)]
pub struct WriteProjectOptions {
    /// Generator name recorded in the manifest. Default: `opensdk`.
    pub generator: Option<String>,
    /// 3-way merge: preserve hand-edits to generated `overwrite` files across
    /// regeneration (base = the stored `.sdk/base/` snapshot). Default: false.
    pub merge: bool,
}

/// Per-run summary of what `write_project` did (rel paths, sorted by processing order).
#[derive(Debug, Default, Clone)]
pub struct WriteProjectResult {
    /// Files created or rewritten this run.
    pub written: Vec<String>,
    /// Files deliberately left alone: existing 'skipIfExists' scaffold + unparseable 'mergeJson' targets.
    pub skipped: Vec<String>,
    /// Files whose on-disk bytes already matched the target — not rewritten.
    pub unchanged: Vec<String>,
    /// Stale generated files deleted (previous-manifest entries still pristine on disk).
    pub pruned: Vec<String>,
    /// Stale but locally-modified orphans KEPT on disk — the caller's warning list.
    pub kept_modified: Vec<String>,
    /// `.sdkignore`-matched files whose existing content DIFFERS from the fresh output — kept.
    pub conflicts: Vec<String>,
    /// (merge mode) User-modified `overwrite` files 3-way merged CLEANLY.
    pub merged: Vec<String>,
    /// (merge mode) User-modified files whose 3-way merge hit a conflict (git markers written).
    pub merge_conflicts: Vec<String>,
}

/// Lowercase-hex sha256 of `content` as UTF-8 (matches Node `crypto.createHash('sha256')`).
pub fn sha256_hex(content: &str) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let digest = Sha256::digest(content.as_bytes());
    let mut s = String::with_capacity(64);
    for b in digest {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0x0f) as usize] as char);
    }
    s
}

fn read_if_exists(full: &Path) -> Option<String> {
    fs::read_to_string(full).ok()
}

fn mkdir_parent(full: &Path) -> io::Result<()> {
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

/// `JSON.stringify(value, null, 2)` equivalent (serde_json 2-space pretty; with the
/// `preserve_order` feature, object key order matches the parse/build order).
fn to_pretty(value: &Value) -> String {
    serde_json::to_string_pretty(value).expect("serialize json value")
}

fn manifest_to_string(manifest: &ProjectManifest) -> String {
    serde_json::to_string_pretty(manifest).expect("serialize manifest")
}

/// Canonicalize JSON text to `JSON.stringify(_, null, 2) + "\n"`; non-JSON passes through.
fn canonical_json(content: &str) -> String {
    match serde_json::from_str::<Value>(content) {
        Ok(v) => format!("{}\n", to_pretty(&v)),
        Err(_) => content.to_string(),
    }
}

/// Write a generated file map to disk with the full regen lifecycle. The only
/// fs-touching entry point. See the module docs for the ordered semantics.
pub fn write_project(
    files: &FileMap,
    out_dir: &Path,
    options: &WriteProjectOptions,
) -> io::Result<WriteProjectResult> {
    let base_dir_prefix = format!("{SDK_BASE_DIR}/");

    let mut result = WriteProjectResult::default();
    // rel -> sha256 of the PRISTINE generated content (the prune guard's fingerprint).
    let mut manifest_files: BTreeMap<String, String> = BTreeMap::new();
    // (merge mode) sha256 -> pristine generated content, staged into `.sdk/base/`.
    let mut base_objects: BTreeMap<String, String> = BTreeMap::new();

    let lock_raw = read_if_exists(&out_dir.join(SDK_LOCK_FILENAME));
    let previous = read_manifest(lock_raw.as_deref());
    let ignore_raw = read_if_exists(&out_dir.join(SDK_IGNORE_FILENAME));
    let ignore = parse_sdk_ignore(ignore_raw.as_deref());

    // Sorted for deterministic write order (and a deterministic result/manifest).
    let mut entries: Vec<&(String, FileEntry)> = files.iter().collect();
    entries.sort_by(|a, b| a.0.cmp(&b.0));

    // Membership set for the prune guard (`rel in files`).
    let file_keys: HashSet<&str> = files.iter().map(|(k, _)| k.as_str()).collect();

    for pair in &entries {
        let rel = pair.0.as_str();
        let entry = &pair.1;
        if rel == SDK_LOCK_FILENAME
            || rel == SDK_IGNORE_FILENAME
            || rel.starts_with(&base_dir_prefix)
        {
            return Err(io::Error::other(format!(
                "write_project: the file map may not emit {rel} (write_project owns .sdk/)"
            )));
        }
        let full = out_dir.join(rel);
        let mode = entry.write_mode;
        let existing = read_if_exists(&full);

        // `.sdkignore` wins over any writeMode: the path is user-owned. Never
        // overwrite an existing one; only bootstrap it if it's missing.
        if !ignore.is_empty() && is_sdk_ignored(rel, &ignore) {
            let candidate = if mode == WriteMode::MergeJson {
                canonical_json(&entry.content)
            } else {
                entry.content.clone()
            };
            manifest_files.insert(rel.to_string(), sha256_hex(&candidate));
            match &existing {
                None => {
                    mkdir_parent(&full)?;
                    fs::write(&full, &candidate)?;
                    result.written.push(rel.to_string());
                }
                Some(e) if *e == candidate => result.unchanged.push(rel.to_string()),
                Some(_) => result.conflicts.push(rel.to_string()),
            }
            continue;
        }

        let mut target = entry.content.clone();
        let mut pristine_hash = sha256_hex(&entry.content);

        if mode == WriteMode::SkipIfExists && existing.is_some() {
            // User-owned scaffold: hash the generated CANDIDATE, not the user's file.
            result.skipped.push(rel.to_string());
            manifest_files.insert(rel.to_string(), pristine_hash);
            continue;
        }

        if mode == WriteMode::MergeJson {
            // Emitter bug if the generated content isn't JSON — fail loud.
            let generated: Value = serde_json::from_str(&entry.content).map_err(|e| {
                io::Error::new(
                    io::ErrorKind::InvalidData,
                    format!("write_project: mergeJson emitter produced non-JSON for {rel}: {e}"),
                )
            })?;
            let canonical = format!("{}\n", to_pretty(&generated));
            target = canonical.clone();
            // Only a merge result byte-identical to the pristine generated output
            // (no surviving user keys) may ever be pruned.
            pristine_hash = sha256_hex(&canonical);
            if let Some(e) = &existing {
                match serde_json::from_str::<Value>(e) {
                    Err(_) => {
                        // Unparseable user JSON: never clobber it — leave it alone.
                        result.skipped.push(rel.to_string());
                        manifest_files.insert(rel.to_string(), pristine_hash);
                        continue;
                    }
                    Ok(existing_json) => {
                        target = format!(
                            "{}\n",
                            to_pretty(&deep_merge_json(&generated, &existing_json))
                        );
                    }
                }
            }
        }

        manifest_files.insert(rel.to_string(), pristine_hash.clone());

        // Merge mode (`overwrite` files only): stage this run's pristine content as
        // the next base, and 3-way merge a HAND-EDITED file instead of clobbering it.
        if options.merge && mode == WriteMode::Overwrite {
            base_objects.insert(pristine_hash.clone(), target.clone());
            let prev_sha = previous.as_ref().and_then(|p| p.files.get(rel));
            let modified = match &existing {
                None => false,
                Some(e) => match prev_sha {
                    None => true,
                    Some(ps) => sha256_hex(e) != *ps,
                },
            };
            if modified && existing.as_deref() != Some(target.as_str()) {
                let e = existing.as_ref().unwrap();
                let base =
                    prev_sha.and_then(|ps| read_if_exists(&out_dir.join(SDK_BASE_DIR).join(ps)));
                match &base {
                    Some(b)
                        if !is_probably_binary(b)
                            && !is_probably_binary(e)
                            && !is_probably_binary(&target) =>
                    {
                        let m = merge3(
                            b,
                            e,
                            &target,
                            &Merge3Options {
                                labels: Merge3Labels {
                                    ours: "your edits".to_string(),
                                    theirs: "generated".to_string(),
                                },
                            },
                        );
                        if m.text == *e {
                            result.unchanged.push(rel.to_string());
                        } else {
                            mkdir_parent(&full)?;
                            fs::write(&full, &m.text)?;
                            if m.clean {
                                result.merged.push(rel.to_string());
                            } else {
                                result.merge_conflicts.push(rel.to_string());
                            }
                        }
                    }
                    _ => {
                        // No base yet (first merge run) or binary content — keep edits.
                        result.kept_modified.push(rel.to_string());
                    }
                }
                continue;
            }
        }

        if existing.as_deref() == Some(target.as_str()) {
            result.unchanged.push(rel.to_string());
            continue;
        }
        mkdir_parent(&full)?;
        fs::write(&full, &target)?;
        result.written.push(rel.to_string());
    }

    // Guarded stale-prune — only with a previous manifest (first adoption never deletes).
    if let Some(prev) = &previous {
        let mut stale: Vec<&String> = prev
            .files
            .keys()
            .filter(|rel| {
                !file_keys.contains(rel.as_str())
                    && rel.as_str() != SDK_LOCK_FILENAME
                    && rel.as_str() != SDK_IGNORE_FILENAME
            })
            .collect();
        stale.sort();
        for rel in stale {
            // A `.sdkignore`-matched path is user-owned — never prune it.
            if !ignore.is_empty() && is_sdk_ignored(rel, &ignore) {
                continue;
            }
            let full = out_dir.join(rel);
            let on_disk = match read_if_exists(&full) {
                None => continue, // already gone
                Some(x) => x,
            };
            if sha256_hex(&on_disk) != prev.files[rel] {
                result.kept_modified.push(rel.clone()); // locally modified — keep, warn
                continue;
            }
            if fs::remove_file(&full).is_err() {
                continue; // racing deletion / permissions — keep going
            }
            result.pruned.push(rel.clone());
            if let Some(parent) = full.parent() {
                remove_empty_parents(parent, out_dir);
            }
        }
    }

    // Base snapshot (merge mode): persist pristine content-addressed under
    // `.sdk/base/<sha>` (write-if-absent), then prune unreferenced objects.
    if options.merge {
        let base_dir = out_dir.join(SDK_BASE_DIR);
        fs::create_dir_all(&base_dir)?;
        for (sha, content) in &base_objects {
            let obj_full = base_dir.join(sha);
            if read_if_exists(&obj_full).is_none() {
                fs::write(&obj_full, content)?;
            }
        }
        if let Ok(rd) = fs::read_dir(&base_dir) {
            for e in rd.flatten() {
                let name = e.file_name().to_string_lossy().to_string();
                if !base_objects.contains_key(&name) {
                    let _ = fs::remove_file(e.path());
                }
            }
        }
    }

    // Lock last, sorted + timestamp-free (identical-content no-op applies to it too).
    let manifest = ProjectManifest {
        schema_version: MANIFEST_SCHEMA_VERSION,
        generator: options
            .generator
            .clone()
            .unwrap_or_else(|| "opensdk".to_string()),
        files: manifest_files,
    };
    let manifest_content = format!("{}\n", manifest_to_string(&manifest));
    let manifest_full = out_dir.join(SDK_LOCK_FILENAME);
    if read_if_exists(&manifest_full).as_deref() != Some(manifest_content.as_str()) {
        mkdir_parent(&manifest_full)?;
        fs::write(&manifest_full, &manifest_content)?;
    }

    Ok(result)
}

/// Disk-less analog of [`write_project`] for a FRESH project: resolve a file map
/// into a flat `[(relPath, content)]` tree INCLUDING the `.sdk/sdk.lock` manifest.
/// Insertion-ordered like the JS `Record` (files in order, base objects inline,
/// lock last). Panics on the `.sdk/` invariant / non-JSON mergeJson (mirrors the JS throw).
pub fn materialize_project(
    files: &FileMap,
    options: &WriteProjectOptions,
) -> Vec<(String, String)> {
    let base_dir_prefix = format!("{SDK_BASE_DIR}/");
    let mut out: Vec<(String, String)> = Vec::new();
    let mut manifest_files: BTreeMap<String, String> = BTreeMap::new();

    for (rel, entry) in files {
        if rel == SDK_LOCK_FILENAME
            || rel == SDK_IGNORE_FILENAME
            || rel.starts_with(&base_dir_prefix)
        {
            panic!("materialize_project: the file map may not emit {rel} (it owns .sdk/)");
        }
        // mergeJson has nothing to merge into on a fresh tree — canonicalize.
        let content = if entry.write_mode == WriteMode::MergeJson {
            let v: Value = serde_json::from_str(&entry.content)
                .expect("materialize_project: mergeJson emitter produced non-JSON");
            format!("{}\n", to_pretty(&v))
        } else {
            entry.content.clone()
        };
        out.push((rel.clone(), content.clone()));
        let hash = sha256_hex(&content);
        manifest_files.insert(rel.clone(), hash.clone());
        if options.merge && entry.write_mode == WriteMode::Overwrite {
            out.push((format!("{SDK_BASE_DIR}/{hash}"), content));
        }
    }

    let manifest = ProjectManifest {
        schema_version: MANIFEST_SCHEMA_VERSION,
        generator: options
            .generator
            .clone()
            .unwrap_or_else(|| "opensdk".to_string()),
        files: manifest_files,
    };
    out.push((
        SDK_LOCK_FILENAME.to_string(),
        format!("{}\n", manifest_to_string(&manifest)),
    ));
    out
}

/// Parse + validate a previous manifest. Absent, malformed or newer-schema
/// manifests are ignored (no prune) — mirrors the TS `readManifest`.
fn read_manifest(raw: Option<&str>) -> Option<ProjectManifest> {
    let raw = raw?;
    let parsed: Value = serde_json::from_str(raw).ok()?;
    let obj = parsed.as_object()?;
    let schema_val = obj.get("schemaVersion")?;
    if !schema_val.is_number() {
        return None;
    }
    let schema = schema_val.as_u64()?;
    let generator = obj.get("generator")?.as_str()?.to_string();
    // files must be a non-null object (not array), every value a string.
    let files_obj = obj.get("files")?.as_object()?;
    let mut files = BTreeMap::new();
    for (k, v) in files_obj {
        let s = v.as_str()?;
        files.insert(k.clone(), s.to_string());
    }
    if schema > MANIFEST_SCHEMA_VERSION {
        return None;
    }
    Some(ProjectManifest {
        schema_version: schema,
        generator,
        files,
    })
}

/// Parse a `.sdkignore` file into its pattern lines (blank + `#`-comment lines dropped,
/// order preserved). A None/absent file yields an empty list.
pub fn parse_sdk_ignore(content: Option<&str>) -> Vec<String> {
    let content = match content {
        None => return Vec::new(),
        Some(c) => c,
    };
    content
        .split('\n')
        .map(|line| line.trim()) // trims a trailing '\r' too (Unicode whitespace)
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .map(|s| s.to_string())
        .collect()
}

/// gitignore-style match of a project-relative POSIX path against `.sdkignore`
/// patterns. `!`-negation: the LAST matching pattern wins. Mirrors `isSdkIgnored`.
pub fn is_sdk_ignored(rel: &str, patterns: &[String]) -> bool {
    let normalized = rel.replace('\\', "/");
    let rel_path = normalized.trim_start_matches('/');
    let mut ignored = false;
    for raw in patterns {
        let (negate, pattern) = match raw.strip_prefix('!') {
            Some(rest) => (true, rest),
            None => (false, raw.as_str()),
        };
        if pattern.is_empty() {
            continue;
        }
        if ignore_pattern_matches(rel_path, pattern) {
            ignored = !negate;
        }
    }
    ignored
}

/// Match one (non-negated) gitignore pattern against a normalized rel path.
fn ignore_pattern_matches(rel_path: &str, pattern: &str) -> bool {
    let pat = pattern.trim_end_matches('/'); // drop trailing dir slash(es)
    let pat = pat.strip_prefix('/').unwrap_or(pat); // a leading slash anchors at root
    let anchored = pat.contains('/'); // a mid/lead slash anchors; else match at any depth
    let body = ignore_glob_to_regexp(pat);
    let prefix = if anchored { "^" } else { "^(?:.*/)?" };
    match Regex::new(&format!("{prefix}{body}(?:/.*)?$")) {
        Ok(re) => re.is_match(rel_path),
        Err(_) => false,
    }
}

/// Convert a glob body to a regex body: `**`→`.*`, `*`→`[^/]*`, `?`→`[^/]`, else escaped literal.
fn ignore_glob_to_regexp(glob: &str) -> String {
    let chars: Vec<char> = glob.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '*' {
            if i + 1 < chars.len() && chars[i + 1] == '*' {
                out.push_str(".*");
                i += 1;
            } else {
                out.push_str("[^/]*");
            }
        } else if c == '?' {
            out.push_str("[^/]");
        } else {
            // Escape the same metacharacters as the TS `/[.+^${}()|[\]\\]/g`.
            if matches!(
                c,
                '.' | '+' | '^' | '$' | '{' | '}' | '(' | ')' | '|' | '[' | ']' | '\\'
            ) {
                out.push('\\');
            }
            out.push(c);
        }
        i += 1;
    }
    out
}

/// Deep-merge the generated JSON INTO the existing file's JSON: both objects →
/// recurse per key (keys only one side has are kept); any other conflict → the
/// EXISTING value wins (arrays replace as a unit). Mirrors `deepMergeJson`.
pub fn deep_merge_json(generated: &Value, existing: &Value) -> Value {
    match (generated, existing) {
        (Value::Object(g), Value::Object(e)) => {
            let mut merged = g.clone(); // preserves generated key order
            for (key, value) in e.iter() {
                let new_val = match merged.get(key) {
                    Some(cur) => deep_merge_json(cur, value),
                    None => value.clone(),
                };
                merged.insert(key.clone(), new_val); // existing key keeps its position
            }
            Value::Object(merged)
        }
        _ => existing.clone(),
    }
}

/// Walk up from `start_dir` removing now-empty directories until hitting `stop_dir`
/// (exclusive) or a non-empty directory. Errors are ignored.
fn remove_empty_parents(start_dir: &Path, stop_dir: &Path) {
    let mut current = start_dir.to_path_buf();
    loop {
        if current == stop_dir || !current.starts_with(stop_dir) {
            return;
        }
        match fs::read_dir(&current) {
            Err(_) => return,
            Ok(mut rd) => {
                if rd.next().is_some() {
                    return; // non-empty
                }
            }
        }
        if fs::remove_dir(&current).is_err() {
            return;
        }
        match current.parent() {
            Some(p) => current = p.to_path_buf(),
            None => return,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn owned(content: &str) -> FileEntry {
        FileEntry {
            content: content.to_string(),
            write_mode: WriteMode::Overwrite,
        }
    }
    fn scaffold(content: &str) -> FileEntry {
        FileEntry {
            content: content.to_string(),
            write_mode: WriteMode::SkipIfExists,
        }
    }
    fn merge_json(content: &str) -> FileEntry {
        FileEntry {
            content: content.to_string(),
            write_mode: WriteMode::MergeJson,
        }
    }

    /// A unique temp dir under the OS temp root (no external tempdir crate).
    fn tmp_dir(tag: &str) -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        static N: AtomicU64 = AtomicU64::new(0);
        let n = N.fetch_add(1, Ordering::SeqCst);
        let dir =
            std::env::temp_dir().join(format!("xyd_osf_test_{tag}_{}_{}", std::process::id(), n));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn read(dir: &Path, rel: &str) -> Option<String> {
        fs::read_to_string(dir.join(rel)).ok()
    }

    #[test]
    fn sha256_matches_known_vector() {
        // echo -n "" | sha256sum
        assert_eq!(
            sha256_hex(""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        // "/target\n" is opencli2rust's generated .gitignore — its committed lock hash.
        assert_eq!(
            sha256_hex("/target\n"),
            "44c92e3a70ad3307b7056871c2bdb096d8bfa9373f5bf06a79bb6324a20ff2fb"
        );
    }

    #[test]
    fn lock_format_is_json_stringify_2space_sorted_trailing_nl() {
        let mut files = BTreeMap::new();
        files.insert("b.rs".to_string(), "22".to_string());
        files.insert("a.rs".to_string(), "11".to_string());
        let m = ProjectManifest {
            schema_version: 1,
            generator: "opencli2rust".to_string(),
            files,
        };
        let out = format!("{}\n", manifest_to_string(&m));
        let expected = "{\n  \"schemaVersion\": 1,\n  \"generator\": \"opencli2rust\",\n  \"files\": {\n    \"a.rs\": \"11\",\n    \"b.rs\": \"22\"\n  }\n}\n";
        assert_eq!(out, expected);
    }

    #[test]
    fn writes_lock_and_files_then_no_op_regen() {
        let dir = tmp_dir("basic");
        let files: FileMap = vec![
            ("src/gen/a.rs".to_string(), owned("fn a() {}\n")),
            ("Cargo.toml".to_string(), scaffold("[package]\n")),
        ];
        let opts = WriteProjectOptions {
            generator: Some("opencli2rust".to_string()),
            merge: false,
        };
        let r1 = write_project(&files, &dir, &opts).unwrap();
        assert_eq!(r1.written, vec!["Cargo.toml", "src/gen/a.rs"]); // sorted order
        assert!(read(&dir, "src/gen/a.rs").is_some());
        let lock = read(&dir, ".sdk/sdk.lock").unwrap();
        // lock records BOTH files (skipIfExists still hashes the pristine candidate).
        assert!(lock.contains("\"Cargo.toml\""));
        assert!(lock.contains("\"src/gen/a.rs\""));

        // No-op regen: identical content → unchanged; existing scaffold → skipped.
        let r2 = write_project(&files, &dir, &opts).unwrap();
        assert_eq!(r2.unchanged, vec!["src/gen/a.rs"]);
        assert_eq!(r2.skipped, vec!["Cargo.toml"]);
        assert!(r2.written.is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn skip_if_exists_never_clobbers_but_locks_pristine() {
        let dir = tmp_dir("skip");
        let opts = WriteProjectOptions {
            generator: None,
            merge: false,
        };
        // First write the scaffold, then user customizes it, then regen keeps it.
        write_project(
            &vec![("README.md".to_string(), scaffold("gen\n"))],
            &dir,
            &opts,
        )
        .unwrap();
        fs::write(dir.join("README.md"), "USER EDIT\n").unwrap();
        let r = write_project(
            &vec![("README.md".to_string(), scaffold("gen\n"))],
            &dir,
            &opts,
        )
        .unwrap();
        assert_eq!(r.skipped, vec!["README.md"]);
        assert_eq!(read(&dir, "README.md").unwrap(), "USER EDIT\n");
        // Lock still holds the pristine generated hash, not the user's.
        let lock = read(&dir, ".sdk/sdk.lock").unwrap();
        assert!(lock.contains(&sha256_hex("gen\n")));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn merge_json_existing_user_keys_win_arrays_replace() {
        let dir = tmp_dir("mergejson");
        let opts = WriteProjectOptions::default();
        // existing user config
        fs::write(
            dir.join("config.json"),
            "{\n  \"a\": \"user\",\n  \"list\": [9],\n  \"keep\": true\n}\n",
        )
        .unwrap();
        // generated tries to set a, list, and adds "gen"
        let gen = "{\"a\":\"gen\",\"list\":[1,2],\"gen\":1}";
        let r = write_project(
            &vec![("config.json".to_string(), merge_json(gen))],
            &dir,
            &opts,
        )
        .unwrap();
        assert_eq!(r.written, vec!["config.json"]);
        let merged: Value = serde_json::from_str(&read(&dir, "config.json").unwrap()).unwrap();
        assert_eq!(merged["a"], Value::from("user")); // existing wins
        assert_eq!(merged["list"], serde_json::json!([9])); // array replaced by existing
        assert_eq!(merged["keep"], Value::from(true)); // existing-only kept
        assert_eq!(merged["gen"], Value::from(1)); // generated-only added
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn sdkignore_wins_over_writemode_and_is_never_pruned() {
        let dir = tmp_dir("ignore");
        let opts = WriteProjectOptions {
            generator: Some("g".to_string()),
            merge: false,
        };
        // User protects an overwrite-mode file.
        fs::write(dir.join(".sdkignore"), "protected.rs\n").unwrap();
        fs::write(dir.join("protected.rs"), "USER\n").unwrap();
        let files: FileMap = vec![("protected.rs".to_string(), owned("GENERATED\n"))];
        let r = write_project(&files, &dir, &opts).unwrap();
        // Not overwritten; reported as a conflict; on-disk content preserved.
        assert_eq!(r.conflicts, vec!["protected.rs"]);
        assert!(r.written.is_empty());
        assert_eq!(read(&dir, "protected.rs").unwrap(), "USER\n");
        // Lock records the pristine GENERATED candidate hash.
        let lock = read(&dir, ".sdk/sdk.lock").unwrap();
        assert!(lock.contains(&sha256_hex("GENERATED\n")));

        // Now the file is no longer generated: it must NOT be pruned (ignore-protected).
        let r2 = write_project(&vec![("other.rs".to_string(), owned("x\n"))], &dir, &opts).unwrap();
        assert!(r2.pruned.is_empty());
        assert!(dir.join("protected.rs").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn prune_guard_deletes_pristine_keeps_modified() {
        let dir = tmp_dir("prune");
        let opts = WriteProjectOptions {
            generator: Some("g".to_string()),
            merge: false,
        };
        // Run 1: two generated files (+ empty-parent test via nested dir).
        write_project(
            &vec![
                ("src/gen/a.rs".to_string(), owned("A\n")),
                ("src/gen/b.rs".to_string(), owned("B\n")),
            ],
            &dir,
            &opts,
        )
        .unwrap();
        // User edits b.rs (making it a modified orphan next run).
        fs::write(dir.join("src/gen/b.rs"), "B EDITED\n").unwrap();

        // Run 2: only a.rs is generated. a.rs pristine-orphan? no, a.rs still generated.
        // Drop BOTH; a.rs was pristine → pruned; b.rs modified → kept.
        let r = write_project(&vec![("keep.rs".to_string(), owned("K\n"))], &dir, &opts).unwrap();
        assert_eq!(r.pruned, vec!["src/gen/a.rs"]);
        assert_eq!(r.kept_modified, vec!["src/gen/b.rs"]);
        assert!(!dir.join("src/gen/a.rs").exists());
        assert!(dir.join("src/gen/b.rs").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn merge_mode_3way_preserves_hand_edits_and_conflicts() {
        let dir = tmp_dir("merge");
        let opts = WriteProjectOptions {
            generator: Some("g".to_string()),
            merge: true,
        };
        // Run 1: seed base snapshot.
        write_project(&vec![("f.rs".to_string(), owned("a\nb\nc\n"))], &dir, &opts).unwrap();
        assert!(dir.join(".sdk/base").exists());
        // User edits the FIRST line; generator changes the LAST line → clean 3-way merge.
        fs::write(dir.join("f.rs"), "A\nb\nc\n").unwrap();
        let r =
            write_project(&vec![("f.rs".to_string(), owned("a\nb\nC\n"))], &dir, &opts).unwrap();
        assert_eq!(r.merged, vec!["f.rs"], "clean merge expected");
        assert_eq!(read(&dir, "f.rs").unwrap(), "A\nb\nC\n");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn file_map_may_not_emit_sdk_paths() {
        let dir = tmp_dir("guard");
        let opts = WriteProjectOptions::default();
        let err = write_project(
            &vec![(".sdk/sdk.lock".to_string(), owned("x"))],
            &dir,
            &opts,
        );
        assert!(err.is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn sdkignore_matching_pattern_classes() {
        // bare name matches at any depth (and everything beneath it)
        let pats = parse_sdk_ignore(Some("node_modules\n"));
        assert!(is_sdk_ignored("node_modules", &pats));
        assert!(is_sdk_ignored("a/b/node_modules/x.js", &pats));

        // has-slash ⇒ anchored at root
        let pats = parse_sdk_ignore(Some("src/config.rs\n"));
        assert!(is_sdk_ignored("src/config.rs", &pats));
        assert!(!is_sdk_ignored("deep/src/config.rs", &pats));

        // Leading-slash quirk (byte-parity with write.ts): the matcher strips a
        // leading `/` BEFORE its "has-a-slash ⇒ anchored" test, so `/LICENSE`
        // collapses to the unanchored `LICENSE` and matches at ANY depth. This is
        // exactly the quirk the crate's .sdkignore comment warns about.
        let pats = parse_sdk_ignore(Some("/LICENSE\n"));
        assert!(is_sdk_ignored("LICENSE", &pats));
        assert!(is_sdk_ignored("sub/LICENSE", &pats));
        // A pattern that KEEPS an interior slash stays anchored at the root.
        let pats = parse_sdk_ignore(Some("/pkg/LICENSE\n"));
        assert!(is_sdk_ignored("pkg/LICENSE", &pats));
        assert!(!is_sdk_ignored("sub/pkg/LICENSE", &pats));

        // ** across segments; * within a segment
        let pats = parse_sdk_ignore(Some("src/v0/**\n"));
        assert!(is_sdk_ignored("src/v0/mod.rs", &pats));
        assert!(is_sdk_ignored("src/v0/deep/x.rs", &pats));
        let pats = parse_sdk_ignore(Some("*.log\n"));
        assert!(is_sdk_ignored("x.log", &pats));
        assert!(is_sdk_ignored("a/b/x.log", &pats));
        assert!(!is_sdk_ignored("x.txt", &pats));

        // trailing slash = directory (and everything under it)
        let pats = parse_sdk_ignore(Some("dist/\n"));
        assert!(is_sdk_ignored("dist", &pats));
        assert!(is_sdk_ignored("dist/app.js", &pats));

        // negation: last match wins
        let pats = parse_sdk_ignore(Some("*.rs\n!keep.rs\n"));
        assert!(is_sdk_ignored("a.rs", &pats));
        assert!(!is_sdk_ignored("keep.rs", &pats));

        // matched dir covers everything beneath (the `(?:/.*)?$` suffix)
        let pats = parse_sdk_ignore(Some("internal\n"));
        assert!(is_sdk_ignored("internal", &pats));
        assert!(is_sdk_ignored("internal/deep/thing.rs", &pats));

        // comments + blanks dropped
        let pats = parse_sdk_ignore(Some("# a comment\n\n  Cargo.toml  \n"));
        assert_eq!(pats, vec!["Cargo.toml".to_string()]);
    }

    #[test]
    fn materialize_project_includes_lock() {
        let files: FileMap = vec![
            ("a.rs".to_string(), owned("A\n")),
            ("pkg.json".to_string(), merge_json("{\"x\":1}")),
        ];
        let opts = WriteProjectOptions {
            generator: Some("g".to_string()),
            merge: false,
        };
        let out = materialize_project(&files, &opts);
        let map: BTreeMap<String, String> = out.iter().cloned().collect();
        assert_eq!(map.get("a.rs").unwrap(), "A\n");
        // mergeJson canonicalized on a fresh tree.
        assert_eq!(map.get("pkg.json").unwrap(), "{\n  \"x\": 1\n}\n");
        let lock = map.get(".sdk/sdk.lock").unwrap();
        assert!(lock.contains(&sha256_hex("A\n")));
        assert!(lock.contains(&sha256_hex("{\n  \"x\": 1\n}\n")));
        // lock is last.
        assert_eq!(out.last().unwrap().0, ".sdk/sdk.lock");
    }
}
