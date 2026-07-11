import { Icon } from "@apitoolchain/design-system";
import { useMemo, useState } from "react";
import type { PreviewFile } from "../model/types";
import { FileIcon } from "./FileIcon";

/** A file/folder tree built from the flat generated-file paths. */
type Node =
  | { type: "dir"; name: string; path: string; children: Node[] }
  | { type: "file"; name: string; path: string };

function buildTree(files: PreviewFile[]): Node[] {
  const root: Node[] = [];
  for (const f of files) {
    const parts = f.path.split("/");
    let level = root;
    let prefix = "";
    for (let i = 0; i < parts.length - 1; i++) {
      prefix = prefix ? `${prefix}/${parts[i]}` : parts[i];
      let dir = level.find(
        (n): n is Extract<Node, { type: "dir" }> =>
          n.type === "dir" && n.name === parts[i],
      );
      if (!dir) {
        dir = { type: "dir", name: parts[i], path: prefix, children: [] };
        level.push(dir);
      }
      level = dir.children;
    }
    level.push({ type: "file", name: parts[parts.length - 1], path: f.path });
  }
  sort(root);
  return root;
}

/** Folders first, then files; alphabetical within each. */
function sort(nodes: Node[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const n of nodes) if (n.type === "dir") sort(n.children);
}

export function FileTree({
  files,
  selectedPath,
  onSelect,
  changedPaths,
  maxHeightClass = "max-h-[calc(100vh-11rem)]",
}: {
  files: PreviewFile[];
  selectedPath?: string;
  onSelect: (path: string) => void;
  /** paths changed by the last edit — marked with a dot. */
  changedPaths?: Set<string>;
  /** Cap + scroll the tree at this height; "" lets it flow (host scrolls). */
  maxHeightClass?: string;
}) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  return (
    <div
      className={`flex flex-col gap-0.5 overflow-auto rounded-control border border-line bg-surface p-1.5 ${maxHeightClass}`}
    >
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          collapsed={collapsed}
          toggle={toggle}
          changedPaths={changedPaths}
        />
      ))}
    </div>
  );
}

/** A dir is "changed" when any file under it changed. */
function dirChanged(dirPath: string, changed?: Set<string>): boolean {
  if (!changed) return false;
  const prefix = `${dirPath}/`;
  for (const p of changed) if (p.startsWith(prefix)) return true;
  return false;
}

function ChangedDot() {
  return (
    <span
      className="ml-auto size-1.5 shrink-0 rounded-full bg-accent"
      aria-label="changed"
    />
  );
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
  collapsed,
  toggle,
  changedPaths,
}: {
  node: Node;
  depth: number;
  selectedPath?: string;
  onSelect: (path: string) => void;
  collapsed: Set<string>;
  toggle: (path: string) => void;
  changedPaths?: Set<string>;
}) {
  const indent = { paddingLeft: `${depth * 13 + 6}px` };

  if (node.type === "dir") {
    const open = !collapsed.has(node.path);
    const changed = dirChanged(node.path, changedPaths);
    return (
      <>
        <button
          type="button"
          onClick={() => toggle(node.path)}
          style={indent}
          className="flex items-center gap-1 rounded-[6px] py-1 pr-2 text-left font-mono text-[12px] text-subtle hover:bg-hover hover:text-ink"
        >
          <Icon
            icon={open ? "chevronDown" : "chevronRight"}
            size={12}
            className="shrink-0 text-muted"
          />
          <Icon icon="folder" size={14} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {node.name}
          </span>
          {changed && !open && <ChangedDot />}
        </button>
        {open &&
          node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              collapsed={collapsed}
              toggle={toggle}
              changedPaths={changedPaths}
            />
          ))}
      </>
    );
  }

  const active = node.path === selectedPath;
  const changed = changedPaths?.has(node.path) ?? false;
  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      style={indent}
      title={node.path}
      className={`flex items-center gap-1 rounded-[6px] py-1 pr-2 text-left font-mono text-[12px] ${
        active
          ? "bg-surface-muted font-medium text-ink"
          : "text-subtle hover:bg-hover hover:text-ink"
      }`}
    >
      <FileIcon path={node.path} />
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
      {changed && <ChangedDot />}
    </button>
  );
}
