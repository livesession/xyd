import type { Method, Resource } from '@xyd-js/opensdk-core';

const ACTION_RANK: Record<string, number> = {
  list: 0,
  create: 1,
  retrieve: 2,
  get: 2,
  update: 3,
  delete: 4,
};

function actionRank(action: string): number {
  return action in ACTION_RANK ? ACTION_RANK[action] : 100;
}

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  methods: Method[];
  usedActions: Set<string>;
}

function newNode(name: string): TreeNode {
  return { name, children: new Map(), methods: [], usedActions: new Set() };
}

/**
 * Builds the SDK resource tree from operations. Static path segments become
 * nested resource nodes; each operation's method is attached to its resource.
 */
export class ResourceTree {
  private root = newNode('');

  insert(resourcePath: string[], method: Method): void {
    let node = this.root;
    for (const seg of resourcePath) {
      let child = node.children.get(seg);
      if (!child) {
        child = newNode(seg);
        node.children.set(seg, child);
      }
      node = child;
    }
    // Deduplicate action names within the resource node.
    let action = method.action;
    if (node.usedActions.has(action)) {
      let i = 2;
      while (node.usedActions.has(`${action}${i}`)) i++;
      action = `${action}${i}`;
      method.action = action;
    }
    node.usedActions.add(action);
    node.methods.push(method);
  }

  emit(): Resource[] {
    return this.emitChildren(this.root);
  }

  private emitChildren(node: TreeNode): Resource[] {
    return [...node.children.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((child) => this.emitNode(child));
  }

  private emitNode(node: TreeNode): Resource {
    const resource: Resource = { name: node.name };
    const methods = [...node.methods].sort(
      (a, b) => actionRank(a.action) - actionRank(b.action) || a.action.localeCompare(b.action),
    );
    if (methods.length) resource.methods = methods;
    const subs = this.emitChildren(node);
    if (subs.length) resource.resources = subs;
    return resource;
  }
}
