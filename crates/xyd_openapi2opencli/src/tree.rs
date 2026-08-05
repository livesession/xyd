//! CommandTree — port of tree.ts. Static path segments become nested resource
//! nodes; leaves attach to their node, deduped with `-N`, and emit sorted
//! (children by localeCompare, leaves by action rank then localeCompare).

use crate::jsrt::locale_compare;
use crate::model::Command;

fn leaf_rank(name: &str) -> i32 {
    match name {
        "list" => 0,
        "create" => 1,
        "retrieve" | "get" => 2,
        "update" | "modify" | "replace" => 3,
        "delete" => 4,
        _ => 100,
    }
}

struct Node {
    name: String,
    children: Vec<Node>,
    leaves: Vec<Command>,
    used_leaf_names: std::collections::HashSet<String>,
}

impl Node {
    fn new(name: &str) -> Self {
        Node {
            name: name.to_string(),
            children: Vec::new(),
            leaves: Vec::new(),
            used_leaf_names: Default::default(),
        }
    }
}

pub struct CommandTree {
    root: Node,
}

impl Default for CommandTree {
    fn default() -> Self {
        Self::new()
    }
}

impl CommandTree {
    pub fn new() -> Self {
        CommandTree {
            root: Node::new(""),
        }
    }

    pub fn insert(&mut self, resource_path: &[String], mut leaf: Command) {
        let mut node = &mut self.root;
        for seg in resource_path {
            let pos = node.children.iter().position(|c| &c.name == seg);
            let idx = match pos {
                Some(i) => i,
                None => {
                    node.children.push(Node::new(seg));
                    node.children.len() - 1
                }
            };
            node = &mut node.children[idx];
        }
        let mut name = leaf.name.clone();
        if node.used_leaf_names.contains(&name) {
            let mut i = 2u32;
            while node
                .used_leaf_names
                .contains(&format!("{}-{}", leaf.name, i))
            {
                i += 1;
            }
            name = format!("{}-{}", leaf.name, i);
            leaf.name = name.clone();
        }
        node.used_leaf_names.insert(name);
        node.leaves.push(leaf);
    }

    pub fn emit(&self) -> Vec<Command> {
        emit_children(&self.root)
    }
}

fn emit_children(node: &Node) -> Vec<Command> {
    let mut children: Vec<&Node> = node.children.iter().collect();
    children.sort_by(|a, b| locale_compare(&a.name, &b.name));
    let mut out: Vec<Command> = children.iter().map(|c| emit_node(c)).collect();

    let mut leaves = node.leaves.clone();
    leaves.sort_by(|a, b| {
        leaf_rank(&a.name)
            .cmp(&leaf_rank(&b.name))
            .then_with(|| locale_compare(&a.name, &b.name))
    });
    out.extend(leaves);
    out
}

fn emit_node(node: &Node) -> Command {
    let subs = emit_children(node);
    Command {
        name: node.name.clone(),
        commands: if subs.is_empty() { None } else { Some(subs) },
        ..Default::default()
    }
}
