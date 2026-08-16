//! The SDK resource tree — port of src/resourceTree.ts.

use std::collections::HashSet;

use crate::model::{Method, Resource};

fn action_rank(action: &str) -> i32 {
    match action {
        "list" => 0,
        "create" => 1,
        "retrieve" | "get" => 2,
        "update" => 3,
        "delete" => 4,
        _ => 100,
    }
}

struct TreeNode {
    name: String,
    /// insertion-ordered children
    children: Vec<TreeNode>,
    methods: Vec<Method>,
    used_actions: HashSet<String>,
}

impl TreeNode {
    fn new(name: &str) -> Self {
        TreeNode {
            name: name.to_string(),
            children: Vec::new(),
            methods: Vec::new(),
            used_actions: HashSet::new(),
        }
    }
}

pub struct ResourceTree {
    root: TreeNode,
}

impl Default for ResourceTree {
    fn default() -> Self {
        Self::new()
    }
}

impl ResourceTree {
    pub fn new() -> Self {
        ResourceTree {
            root: TreeNode::new(""),
        }
    }

    pub fn insert(&mut self, resource_path: &[String], mut method: Method) {
        let mut node = &mut self.root;
        for seg in resource_path {
            let pos = node.children.iter().position(|c| &c.name == seg);
            let idx = match pos {
                Some(i) => i,
                None => {
                    node.children.push(TreeNode::new(seg));
                    node.children.len() - 1
                }
            };
            node = &mut node.children[idx];
        }
        // Deduplicate action names within the resource node.
        let mut action = method.action.clone();
        if node.used_actions.contains(&action) {
            let mut i = 2u32;
            while node
                .used_actions
                .contains(&format!("{}{}", method.action, i))
            {
                i += 1;
            }
            action = format!("{}{}", method.action, i);
            method.action = action.clone();
        }
        node.used_actions.insert(action);
        node.methods.push(method);
    }

    pub fn emit(&self) -> Vec<Resource> {
        emit_children(&self.root)
    }
}

fn emit_children(node: &TreeNode) -> Vec<Resource> {
    let mut children: Vec<&TreeNode> = node.children.iter().collect();
    // localeCompare on kebab ASCII names == lexicographic; JS sort is stable.
    children.sort_by(|a, b| a.name.cmp(&b.name));
    children.iter().map(|c| emit_node(c)).collect()
}

fn emit_node(node: &TreeNode) -> Resource {
    let mut methods = node.methods.clone();
    methods.sort_by(|a, b| {
        action_rank(&a.action)
            .cmp(&action_rank(&b.action))
            .then_with(|| a.action.cmp(&b.action))
    });
    let subs = emit_children(node);
    Resource {
        name: node.name.clone(),
        methods: if methods.is_empty() {
            None
        } else {
            Some(methods)
        },
        resources: if subs.is_empty() { None } else { Some(subs) },
    }
}
