import type { OpencliSpecJson, Command } from './types.js';

export interface LoadOpencliSpecOptions {
  /**
   * Base directory used to resolve a relative file `source`.
   * Defaults to `process.cwd()`. (The remark plugin passes the markdown file's dirname.)
   */
  cwd?: string;
}

/**
 * Load an OpenCLI spec from a file path or an HTTP(S) URL.
 *
 * Returns `null` (and logs) on any failure so callers can leave placeholders
 * untouched rather than throwing.
 */
export async function loadOpencliSpec(
  source: string,
  opts?: LoadOpencliSpecOptions,
): Promise<OpencliSpecJson | null> {
  try {
    let content: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Load from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenCLI spec: ${response.statusText}`);
      }
      content = await response.text();
    } else {
      // Load from file
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      // Resolve relative to the provided cwd (or process.cwd())
      const base = opts?.cwd ?? process.cwd();
      const resolvedPath = path.isAbsolute(source) ? source : path.resolve(base, source);

      content = await fs.readFile(resolvedPath, 'utf-8');
    }

    return JSON.parse(content) as OpencliSpecJson;
  } catch (error) {
    console.error(`Error loading OpenCLI spec from ${source}:`, error);
    return null;
  }
}

/**
 * Find a command in the spec by path (e.g., "spice install").
 * If the path is empty, returns a synthetic root command built from the spec root.
 */
export function findCommand(spec: OpencliSpecJson, commandPath: string): Command | null {
  let parts = commandPath.trim().split(/\s+/).filter(Boolean);

  // If no path specified, create a synthetic root command from spec root
  if (parts.length === 0) {
    return {
      name: spec.info?.title || 'root',
      description: spec.info?.description || spec.info?.summary,
      options: spec.options || [],
      arguments: spec.arguments || [],
      commands: spec.commands || [],
      examples: spec.examples || [],
      exitCodes: spec.exitCodes || [],
      interactive: spec.interactive,
    };
  }

  // Skip the CLI name if it matches the first part (e.g., "spice install" -> "install")
  if (parts.length > 0 && spec.info?.title && parts[0] === spec.info.title) {
    parts = parts.slice(1);
  }

  // If only the CLI name was provided, return root command
  if (parts.length === 0) {
    return {
      name: spec.info?.title || 'root',
      description: spec.info?.description || spec.info?.summary,
      options: spec.options || [],
      arguments: spec.arguments || [],
      commands: spec.commands || [],
      examples: spec.examples || [],
      exitCodes: spec.exitCodes || [],
      interactive: spec.interactive,
    };
  }

  // Start from root commands
  let currentCommands = spec.commands || [];
  let foundCommand: Command | null = null;

  for (const part of parts) {
    foundCommand = currentCommands.find((cmd) => cmd.name === part || cmd.aliases?.includes(part)) || null;

    if (!foundCommand) {
      return null;
    }

    // Move to subcommands for next iteration
    currentCommands = foundCommand.commands || [];
  }

  return foundCommand;
}
