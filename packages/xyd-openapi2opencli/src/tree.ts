import type { Command } from '@xyd-js/opencli';

const ACTION_RANK: Record<string, number> = {
  list: 0,
  create: 1,
  retrieve: 2,
  get: 2,
  update: 3,
  modify: 3,
  replace: 3,
  delete: 4,
};

function leafRank(name: string): number {
  return name in ACTION_RANK ? ACTION_RANK[name] : 100;
}

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  leaves: Command[];
  usedLeafNames: Set<string>;
}

function newNode(name: string): TreeNode {
  return { name, children: new Map(), leaves: [], usedLeafNames: new Set() };
}

/**
 * Builds the OpenCLI command tree from operations. Static path segments become
 * nested resource nodes; leaf actions are attached to their resource node.
 */
export class CommandTree {
  private root = newNode('');

  insert(resourcePath: string[], leaf: Command): void {
    let node = this.root;
    for (const seg of resourcePath) {
      let child = node.children.get(seg);
      if (!child) {
        child = newNode(seg);
        node.children.set(seg, child);
      }
      node = child;
    }
    // Deduplicate leaf action names within the resource node.
    let name = leaf.name;
    if (node.usedLeafNames.has(name)) {
      let i = 2;
      while (node.usedLeafNames.has(`${name}-${i}`)) i++;
      name = `${name}-${i}`;
      leaf.name = name;
    }
    node.usedLeafNames.add(name);
    node.leaves.push(leaf);
  }

  emit(): Command[] {
    return this.emitChildren(this.root);
  }

  private emitChildren(node: TreeNode): Command[] {
    const children = [...node.children.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((child) => this.emitNode(child));
    const leaves = [...node.leaves].sort(
      (a, b) => leafRank(a.name) - leafRank(b.name) || a.name.localeCompare(b.name),
    );
    return [...children, ...leaves];
  }

  private emitNode(node: TreeNode): Command {
    const cmd: Command = { name: node.name };
    const subs = this.emitChildren(node);
    if (subs.length) cmd.commands = subs;
    return cmd;
  }
}
