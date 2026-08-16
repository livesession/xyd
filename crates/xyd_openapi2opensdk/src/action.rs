//! Method+path → resource placement + action verb — port of src/action.ts.

use serde_json::Value;

use crate::jsrt::{kebab_case, split_words};
use crate::options::{Options, DEFAULT_CUSTOM_ACTION_VERBS};

pub struct PathSegment {
    pub is_param: bool,
    pub value: String,
}

/// Parse `/chat/completions/{completion_id}` into ordered segments.
pub fn parse_path(path: &str) -> Vec<PathSegment> {
    path.split('/')
        .filter(|s| !s.is_empty())
        .map(|seg| {
            if seg.len() >= 2 && seg.starts_with('{') && seg.ends_with('}') {
                PathSegment {
                    is_param: true,
                    value: seg[1..seg.len() - 1].to_string(),
                }
            } else {
                PathSegment {
                    is_param: false,
                    value: seg.to_string(),
                }
            }
        })
        .collect()
}

#[derive(Clone)]
pub struct DerivedTarget {
    /// resource path (kebab), e.g. ["chat","completions"]
    pub resource_path: Vec<String>,
    /// leaf action, e.g. "create" / "retrieve" / "cancel"
    pub action: String,
    /// wire names of path parameters in order (positional arguments)
    pub path_param_names: Vec<String>,
}

fn leading_verb(operation_id: Option<&str>) -> Option<String> {
    split_words(operation_id?).into_iter().next()
}

/// "messages"/"files" read as nested collections; "content"/"remix" as verbs.
fn looks_plural(segment: &str) -> bool {
    let words = split_words(segment);
    let last = words.last().map(String::as_str).unwrap_or("");
    last.ends_with('s') && !last.ends_with("ss")
}

struct Verbs {
    list_collection: String,
    get_item: String,
    create_collection: String,
    update_item: String,
    delete_item: String,
}

fn effective_verbs(options: &Options) -> Verbs {
    let vm = options.verb_map.as_ref();
    let pick = |field: Option<&String>, dflt: &str| -> String {
        field.cloned().unwrap_or_else(|| dflt.to_string())
    };
    Verbs {
        list_collection: pick(vm.and_then(|m| m.list_collection.as_ref()), "list"),
        get_item: pick(vm.and_then(|m| m.get_item.as_ref()), "retrieve"),
        create_collection: pick(vm.and_then(|m| m.create_collection.as_ref()), "create"),
        update_item: pick(vm.and_then(|m| m.update_item.as_ref()), "update"),
        delete_item: pick(vm.and_then(|m| m.delete_item.as_ref()), "delete"),
    }
}

/// Derive resource-tree placement + action from method + path shape.
pub fn derive_target(
    method: &str,
    path: &str,
    operation: &Value,
    options: &Options,
) -> DerivedTarget {
    let verbs = effective_verbs(options);
    let custom_verbs: Vec<String> = options
        .custom_action_verbs
        .clone()
        .unwrap_or_else(|| {
            DEFAULT_CUSTOM_ACTION_VERBS
                .iter()
                .map(|s| s.to_string())
                .collect()
        })
        .into_iter()
        .map(|v| v.to_lowercase())
        .collect();

    let segments = parse_path(path);
    let static_segs: Vec<&str> = segments
        .iter()
        .filter(|s| !s.is_param)
        .map(|s| s.value.as_str())
        .collect();
    let path_param_names: Vec<String> = segments
        .iter()
        .filter(|s| s.is_param)
        .map(|s| s.value.clone())
        .collect();
    let has_params = !path_param_names.is_empty();
    let last = segments.last();
    let m = method.to_lowercase();

    let operation_id = operation.get("operationId").and_then(|v| v.as_str());

    let resource_segs: Vec<&str>;
    let action: String;

    if last.map(|l| l.is_param).unwrap_or(false) {
        resource_segs = static_segs.clone();
        action = if m == "get" {
            verbs.get_item
        } else if m == "put" || m == "patch" {
            verbs.update_item
        } else if m == "delete" {
            verbs.delete_item
        } else {
            // JS `leadingVerb(operationId) || verbs.createCollection` — falls
            // through on empty string too.
            leading_verb(operation_id)
                .filter(|v| !v.is_empty())
                .unwrap_or(verbs.create_collection)
        };
    } else {
        let last_static = static_segs.last().copied();
        let prev = segments.len().checked_sub(2).and_then(|i| segments.get(i));
        // A trailing static segment directly after a path param is a METHOD on
        // the parent resource (unless it reads as a plural nested collection).
        let after_param_verb = has_params
            && last.map(|l| !l.is_param).unwrap_or(false)
            && prev.map(|p| p.is_param).unwrap_or(false)
            && last_static.map(|s| !looks_plural(s)).unwrap_or(false);
        let is_custom_action = has_params
            && last_static
                .map(|s| custom_verbs.contains(&s.to_lowercase()) || after_param_verb)
                .unwrap_or(false);

        if is_custom_action {
            action = kebab_case(last_static.unwrap());
            resource_segs = static_segs[..static_segs.len() - 1].to_vec();
        } else {
            resource_segs = static_segs.clone();
            action = if m == "get" {
                verbs.list_collection
            } else if m == "post" {
                verbs.create_collection
            } else if m == "put" || m == "patch" {
                verbs.update_item
            } else if m == "delete" {
                verbs.delete_item
            } else {
                leading_verb(operation_id)
                    .filter(|v| !v.is_empty())
                    .unwrap_or(m.clone())
            };
        }
    }

    DerivedTarget {
        resource_path: resource_segs.iter().map(|s| kebab_case(s)).collect(),
        action: kebab_case(&action),
        path_param_names,
    }
}
