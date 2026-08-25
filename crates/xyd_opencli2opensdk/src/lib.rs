//! OpenCLI → OpenSDK IR converter (CLI-execution SDK mode).
//!
//! Bridges the two codegen pipelines: given an OpenCLI document (a CLI's
//! command tree — e.g. xyd's own spec, or any hand-authored CLI with no HTTP
//! backing), emit an OpenSDK IR whose methods carry an `x-cli` argv binding
//! (the mirror of the OpenCLI pipeline's `x-openapi` request binding) instead
//! of an HTTP binding. SDK emitters then generate clients that SPAWN the real
//! CLI binary: `xyd --version` → `xyd.optVersion()`, `xyd build --port 3000`
//! → `xyd.build({ port: 3000 })`.
//!
//! Rust-only (no TS counterpart): goldens live in this crate's
//! `__fixtures__/` and regenerate via `XYD_BLESS=1 cargo test`.

mod behavior;
mod binding;
mod jsrt;
mod method;
mod model;
mod nominal;
mod options;
mod resource_tree;

use serde_json::{Map, Value};

use jsrt::{kebab_case, screaming_snake_case, slug};
use method::{build_method, build_opt_method, InheritedOpt};
use model::{Info, Spec, XCliRoot};
use nominal::TypeRegistry;
use resource_tree::ResourceTree;

pub use behavior::{default_cli_behavior, merge_cli_behavior};
pub use model::Spec as OpensdkCliSpec;
pub use options::Options;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(
        "opencli2opensdk: not an OpenCLI document — missing \"opencli\" version field (got {0})"
    )]
    NotOpenCli(String),
    #[error(
        "opencli2opensdk: the document has no commands and no root options — nothing to convert"
    )]
    Empty,
    #[error("opencli2opensdk: {0}")]
    Io(String),
}

fn str_of(v: &Value, key: &str) -> Option<String> {
    v.get(key)
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn is_hidden(v: &Value) -> bool {
    v.get("hidden").and_then(|h| h.as_bool()) == Some(true)
}

fn is_recursive(v: &Value) -> bool {
    v.get("recursive").and_then(|r| r.as_bool()) == Some(true)
}

fn has_value(opt: &Value) -> bool {
    opt.get("arguments")
        .and_then(|a| a.as_array())
        .map(|a| !a.is_empty())
        .unwrap_or(false)
}

fn non_empty_array<'a>(v: &'a Value, key: &str) -> Option<&'a Vec<Value>> {
    v.get(key)
        .and_then(|a| a.as_array())
        .filter(|a| !a.is_empty())
}

fn build_info(doc: &Value, sdk_name: &str, version: &str) -> Info {
    let src = doc.get("info");
    let title = src
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .filter(|t| !t.is_empty())
        .unwrap_or(sdk_name);
    let truthy_str = |v: Option<&Value>| -> Option<String> {
        v.and_then(|s| s.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    };
    let obj_subset = |v: Option<&Value>, keys: &[&str]| -> Option<Map<String, Value>> {
        let src = v?;
        let mut out = Map::new();
        for key in keys {
            if let Some(s) = truthy_str(src.get(*key)) {
                out.insert(key.to_string(), Value::String(s));
            }
        }
        if out.is_empty() {
            None
        } else {
            Some(out)
        }
    };
    Info {
        title: title.to_string(),
        version: version.to_string(),
        description: truthy_str(src.and_then(|i| i.get("description"))),
        summary: truthy_str(src.and_then(|i| i.get("summary"))),
        contact: obj_subset(
            src.and_then(|i| i.get("contact")),
            &["name", "url", "email"],
        ),
        license: obj_subset(
            src.and_then(|i| i.get("license")),
            &["name", "identifier", "url"],
        ),
    }
}

struct Walker<'a> {
    tree: ResourceTree,
    registry: TypeRegistry,
    opts: &'a Options,
    excludes: Vec<String>,
}

impl<'a> Walker<'a> {
    fn visible(&self, v: &Value) -> bool {
        !is_hidden(v) || self.opts.include_hidden()
    }

    /// Extend the inherited stack with this node's `recursive: true` options
    /// (excluded names never materialize as inherited params).
    fn push_recursive_options(
        &self,
        node: &Value,
        node_tokens: &[String],
        inherited: &[InheritedOpt],
    ) -> Vec<InheritedOpt> {
        let mut next: Vec<InheritedOpt> = inherited
            .iter()
            .map(|i| InheritedOpt {
                value: i.value.clone(),
                context: i.context.clone(),
            })
            .collect();
        if let Some(opts) = node.get("options").and_then(|o| o.as_array()) {
            for opt in opts {
                let Some(name) = str_of(opt, "name") else {
                    continue;
                };
                if !is_recursive(opt) || !self.visible(opt) {
                    continue;
                }
                if self.excludes.contains(&name) {
                    continue;
                }
                let mut context = node_tokens.to_vec();
                context.push(name);
                next.push(InheritedOpt {
                    value: opt.clone(),
                    context,
                });
            }
        }
        next
    }

    fn walk_command(
        &mut self,
        cmd: &Value,
        parent_tokens: &[String],
        parent_resource: &[String],
        inherited: &[InheritedOpt],
    ) {
        let Some(name) = str_of(cmd, "name") else {
            return;
        };
        if !self.visible(cmd) {
            return;
        }
        let mut tokens = parent_tokens.to_vec();
        tokens.push(name.clone());

        let children = non_empty_array(cmd, "commands");
        if let Some(children) = children {
            let mut resource = parent_resource.to_vec();
            resource.push(kebab_case(&name));
            // A runnable group (a command that has children AND its own
            // arguments) keeps an `exec` method on its resource.
            if non_empty_array(cmd, "arguments").is_some() {
                let m = build_method(
                    cmd,
                    "exec".to_string(),
                    tokens.clone(),
                    inherited,
                    &mut self.registry,
                    self.opts,
                );
                self.tree.insert(&resource, m);
            }
            let next_inherited = self.push_recursive_options(cmd, &tokens, inherited);
            for child in children {
                self.walk_command(child, &tokens, &resource, &next_inherited);
            }
        } else {
            let m = build_method(
                cmd,
                kebab_case(&name),
                tokens,
                inherited,
                &mut self.registry,
                self.opts,
            );
            self.tree.insert(parent_resource, m);
        }
    }
}

/// Convert an OpenCLI document (read leniently from raw JSON) into the
/// CLI-mode OpenSDK IR.
pub fn opencli2opensdk(doc: &Value, options: Option<Options>) -> Result<Spec, Error> {
    let options = options.unwrap_or_default();

    // Validation-lite: fail loudly instead of emitting an empty IR.
    let opencli_version = match doc.get("opencli").and_then(|v| v.as_str()) {
        Some(v) if !v.is_empty() => v.to_string(),
        _ => {
            let got = match doc.get("opencli") {
                // JSON.stringify(undefined) renders as the literal `undefined`.
                None => "undefined".to_string(),
                Some(v) => serde_json::to_string(v).unwrap_or_default(),
            };
            return Err(Error::NotOpenCli(got));
        }
    };
    let has_commands = non_empty_array(doc, "commands").is_some();
    let has_root_options = non_empty_array(doc, "options").is_some();
    let has_root_arguments = non_empty_array(doc, "arguments").is_some();
    if !has_commands && !has_root_options && !has_root_arguments {
        return Err(Error::Empty);
    }

    let title = doc
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .filter(|t| !t.is_empty())
        .unwrap_or("cli");
    let sdk_name: String = options.sdk_name.clone().unwrap_or_else(|| {
        let s = slug(title);
        if s.is_empty() {
            "cli".to_string()
        } else {
            s
        }
    });
    let bin: String = options.bin.clone().unwrap_or_else(|| sdk_name.clone());
    let env_var: String = options
        .env_var
        .clone()
        .unwrap_or_else(|| format!("{}_BIN", screaming_snake_case(&bin)));
    let version: String = options
        .version
        .clone()
        .or_else(|| {
            doc.get("info")
                .and_then(|i| i.get("version"))
                .and_then(|v| v.as_str())
                .map(|v| v.to_string())
        })
        .unwrap_or_else(|| "0.0.0".to_string());

    let excludes = options.inherited_option_excludes();
    let mut walker = Walker {
        tree: ResourceTree::new(),
        registry: TypeRegistry::new(),
        opts: &options,
        excludes,
    };

    // Root `recursive: true` options flow into every method as params.
    let root_inherited = walker.push_recursive_options(doc, &[], &[]);

    // The root command itself may take positionals (`cli <file>`) → a root
    // `exec` method. Recursive root options arrive via the inherited stack; a
    // synthetic command carries only the root's runnable surface.
    if has_root_arguments {
        // Root `description` is the CLI's own blurb — deliberately not copied.
        let mut synthetic = Map::new();
        for key in ["arguments", "exitCodes", "interactive"] {
            if let Some(v) = doc.get(key) {
                synthetic.insert(key.to_string(), v.clone());
            }
        }
        let m = build_method(
            &Value::Object(synthetic),
            "exec".to_string(),
            Vec::new(),
            &root_inherited,
            &mut walker.registry,
            &options,
        );
        walker.tree.insert(&[], m);
    }

    if let Some(commands) = non_empty_array(doc, "commands") {
        for cmd in commands {
            walker.walk_command(cmd, &[], &[], &root_inherited);
        }
    }

    // Opt-methods: root options that will NOT be materialized as inherited
    // params — value-less options that are excluded (help/version: they
    // short-circuit execution) or non-recursive (they apply only to the bare
    // root invocation). `--version` → `optVersion()`. A value-less recursive
    // non-excluded option (e.g. xyd's `--verbose`) is already a param on
    // every method, so no opt-method is minted for it.
    if options.root_option_methods() {
        if let Some(root_opts) = doc.get("options").and_then(|o| o.as_array()) {
            for opt in root_opts {
                let Some(name) = str_of(opt, "name") else {
                    continue;
                };
                if !walker.visible(opt) || has_value(opt) {
                    continue;
                }
                let materialized_as_param = is_recursive(opt) && !walker.excludes.contains(&name);
                if materialized_as_param {
                    continue;
                }
                if let Some(m) = build_opt_method(opt) {
                    walker.tree.insert(&[], m);
                }
            }
        }
    }

    let methods = walker.tree.emit_root_methods();
    let resources = walker.tree.emit();
    let types = walker.registry.emit();

    Ok(Spec {
        opensdk: "1.0.0".to_string(),
        info: build_info(doc, &sdk_name, &version),
        x_cli: XCliRoot {
            bin,
            env_var,
            opencli: opencli_version,
            conventions: doc.get("conventions").cloned(),
        },
        types: if types.is_empty() { None } else { Some(types) },
        methods: if methods.is_empty() {
            None
        } else {
            Some(methods)
        },
        resources: if resources.is_empty() {
            None
        } else {
            Some(resources)
        },
        // ALWAYS stamped: emitters read policy values, never re-hardcode them.
        sdk: merge_cli_behavior(options.sdk_behavior.as_ref()),
    })
}

/// Read an OpenCLI document from a JSON file and convert it.
pub fn opencli2opensdk_from_file(path: &str, options: Option<Options>) -> Result<Spec, Error> {
    let content = std::fs::read_to_string(path).map_err(|e| Error::Io(e.to_string()))?;
    let doc: Value = serde_json::from_str(&content).map_err(|e| Error::Io(e.to_string()))?;
    opencli2opensdk(&doc, options)
}

/// Convert a document passed as a JSON string (the napi transport).
pub fn opencli2opensdk_from_json_str(
    doc_json: &str,
    options_json: Option<&str>,
) -> Result<String, Error> {
    let doc: Value = serde_json::from_str(doc_json).map_err(|e| Error::Io(e.to_string()))?;
    let options: Option<Options> = match options_json {
        Some(s) => {
            Some(serde_json::from_str(s).map_err(|e| Error::Io(format!("bad options: {e}")))?)
        }
        None => None,
    };
    let spec = opencli2opensdk(&doc, options)?;
    serde_json::to_string(&spec).map_err(|e| Error::Io(e.to_string()))
}
