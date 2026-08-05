//! deriveTarget — method+path → command-tree placement + action verb.
//! Port of action.ts. Simpler custom-action rule than opensdk (only the
//! customVerbs membership test, no after-param heuristic).

use serde_json::Value;

use crate::jsrt::{kebab_case, split_words};
use crate::options::{Options, DEFAULT_CUSTOM_ACTION_VERBS};

struct Segment {
    is_param: bool,
    value: String,
}

fn parse_path(path: &str) -> Vec<Segment> {
    path.split('/')
        .filter(|s| !s.is_empty())
        .map(|seg| {
            if seg.len() >= 2 && seg.starts_with('{') && seg.ends_with('}') {
                Segment {
                    is_param: true,
                    value: seg[1..seg.len() - 1].to_string(),
                }
            } else {
                Segment {
                    is_param: false,
                    value: seg.to_string(),
                }
            }
        })
        .collect()
}

pub struct DerivedTarget {
    pub resource_path: Vec<String>,
    pub action: String,
    pub aliases: Vec<String>,
    pub path_param_names: Vec<String>,
}

struct Verbs {
    list_collection: String,
    get_item: String,
    create_collection: String,
    update_item: String,
    delete_item: String,
}

fn verbs(options: &Options) -> Verbs {
    let vm = options.verb_map.as_ref();
    let pick = |f: Option<&String>, d: &str| f.cloned().unwrap_or_else(|| d.to_string());
    Verbs {
        list_collection: pick(vm.and_then(|m| m.list_collection.as_ref()), "list"),
        get_item: pick(vm.and_then(|m| m.get_item.as_ref()), "retrieve"),
        create_collection: pick(vm.and_then(|m| m.create_collection.as_ref()), "create"),
        update_item: pick(vm.and_then(|m| m.update_item.as_ref()), "update"),
        delete_item: pick(vm.and_then(|m| m.delete_item.as_ref()), "delete"),
    }
}

fn leading_verb(operation_id: Option<&str>) -> Option<String> {
    split_words(operation_id?).into_iter().next()
}

pub fn derive_target(
    method: &str,
    path: &str,
    operation: &Value,
    options: &Options,
) -> DerivedTarget {
    let v = verbs(options);
    let custom: Vec<String> = options
        .custom_action_verbs
        .clone()
        .unwrap_or_else(|| {
            DEFAULT_CUSTOM_ACTION_VERBS
                .iter()
                .map(|s| s.to_string())
                .collect()
        })
        .into_iter()
        .map(|s| s.to_lowercase())
        .collect();
    let action_aliases = options.action_aliases != Some(false);

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
    let mut aliases: Vec<String> = Vec::new();

    if last.map(|l| l.is_param).unwrap_or(false) {
        resource_segs = static_segs.clone();
        action = if m == "get" {
            let a = v.get_item;
            if action_aliases && a == "retrieve" {
                aliases.push("get".to_string());
            }
            a
        } else if m == "put" || m == "patch" {
            v.update_item
        } else if m == "delete" {
            v.delete_item
        } else {
            leading_verb(operation_id)
                .filter(|s| !s.is_empty())
                .unwrap_or(v.create_collection)
        };
    } else {
        let last_static = static_segs.last().copied();
        let is_custom = has_params
            && last_static
                .map(|s| custom.contains(&s.to_lowercase()))
                .unwrap_or(false);
        if is_custom {
            action = kebab_case(last_static.unwrap());
            resource_segs = static_segs[..static_segs.len() - 1].to_vec();
        } else {
            resource_segs = static_segs.clone();
            action = if m == "get" {
                v.list_collection
            } else if m == "post" {
                v.create_collection
            } else if m == "put" || m == "patch" {
                v.update_item
            } else if m == "delete" {
                v.delete_item
            } else {
                leading_verb(operation_id)
                    .filter(|s| !s.is_empty())
                    .unwrap_or(m.clone())
            };
        }
    }

    DerivedTarget {
        resource_path: resource_segs.iter().map(|s| kebab_case(s)).collect(),
        action: kebab_case(&action),
        aliases,
        path_param_names,
    }
}
