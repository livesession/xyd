import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { Root } from 'mdast';
import { matter } from 'vfile-matter';
import type { OpencliSpecJson, Command } from './types.js';
import { load } from 'js-yaml';

export interface OpencliDocsOptions {
  [cliKey: string]: {
    source: string; // File path or URL
  };
}

/**
 * Remark plugin for generating OpenCLI documentation from placeholders
 * 
 * @example
 * ```md
 * ---
 * xyd.opencli.spice: "install"
 * ---
 * 
 * ### Usage
 * {opencli.current.usage}
 * 
 * ### Flags
 * {opencli.current.flags}
 * ```
 * 
 * @example
 * ```ts
 * remarkOpencliDocs({
 *   spice: { source: './spice-spec.json' },
 *   npm: { source: './npm-spec.json' }
 * })
 * ```
 */
export function remarkOpencliDocs(options: OpencliDocsOptions) {
  return async function transformer(tree: Root, file?: VFile) {
    // Return early if no file is provided
    if (!file) {
      return;
    }

    // Ensure file.data exists
    if (!file.data) {
      file.data = {};
    }
    
    // Quick check: look for xyd.opencli.* pattern in YAML nodes before parsing
    let hasOpencliKey = false;
    let yamlContent: string | null = null;
    
    visit(tree, 'yaml', (node: any) => {
      if (node.value && !yamlContent) {
        const content = String(node.value);
        yamlContent = content;
        // Quick string check for xyd.opencli. pattern
        if (content.includes('xyd.opencli.')) {
          hasOpencliKey = true;
        }
      }
    });
    
    // If no YAML node found, check file.value directly
    if (!yamlContent && file.value) {
      const fileValue = typeof file.value === 'string' ? file.value : new TextDecoder().decode(file.value);
      const frontmatterMatch = fileValue.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch && frontmatterMatch[1].includes('xyd.opencli.')) {
        hasOpencliKey = true;
        yamlContent = frontmatterMatch[1];
      }
    }
    
    // If no xyd.opencli.* key found anywhere, return early without any processing
    if (!hasOpencliKey) {
      return;
    }
    
    // Now parse frontmatter since we know there's a potential match
    let frontmatter = file.data.matter as Record<string, any> | undefined;
    
    // If not parsed, parse from YAML content we found
    if (!frontmatter && yamlContent) {
      try {
        frontmatter = load(yamlContent) as Record<string, any>;
        file.data.matter = frontmatter;
      } catch (error) {
        // Failed to parse YAML, try parsing from file.value
        if (file.value) {
          matter(file as any);
          frontmatter = file.data.matter as Record<string, any> | undefined;
        }
      }
    }
    
    // Fallback: try to parse from file.value if YAML nodes weren't found
    if (!frontmatter && file.value) {
      matter(file as any);
      frontmatter = file.data.matter as Record<string, any> | undefined;
    }
    
    // Find xyd.opencli.{cliKey} pattern in frontmatter
    let cliKey: string | null = null;
    let opencliConfig: any = null;

    for (const key in frontmatter) {
      if (key.startsWith('xyd.opencli.')) {
        cliKey = key.substring('xyd.opencli.'.length);
        opencliConfig = frontmatter[key];
        break;
      }
    }

    // If no xyd.opencli.{cliKey} found, return early
    if (!cliKey || opencliConfig === undefined || opencliConfig === null) {
      return;
    }

    // Get the CLI config for this key
    const cliConfig = options[cliKey];
    if (!cliConfig || !cliConfig.source) {
      console.warn(`No configuration found for CLI key "${cliKey}"`);
      return;
    }

    // Parse xyd.opencli.{cliKey} - can be string or object
    let commandPath: string;
    let indentStyle: 'code' | 'list' = 'code'; // default

    if (typeof opencliConfig === 'string') {
      commandPath = opencliConfig;
    } else if (typeof opencliConfig === 'object' && opencliConfig !== null) {
      commandPath = opencliConfig.command || '';
      indentStyle = opencliConfig.indent === 'list' ? 'list' : 'code';
    } else {
      return;
    }

    const normalizedPath = commandPath?.trim() || '';

    // Load OpenCLI spec
    const spec = await loadOpencliSpec(cliConfig.source, file);
    if (!spec) {
      console.warn(`Failed to load OpenCLI spec from ${cliConfig.source}`);
      return;
    }

    // Find the command in the spec
    const command = findCommand(spec, normalizedPath);
    if (!command) {
      console.warn(`Command "${normalizedPath || '(root)'}" not found in OpenCLI spec`);
      return;
    }

    // Build display path: CLI title + command path (or just CLI title for root)
    const cliTitle = spec.info?.title || '';
    const displayPath = normalizedPath 
      ? `${cliTitle} ${normalizedPath}`.trim()
      : cliTitle || command.name;

    // Generate documentation content
    const usage = generateUsage(spec, command, displayPath);
    const description = generateDescription(command);
    // const flags = generateFlags(command);
    const subcommands = generateCommands(command);

    // For code format, generate string content
    const argsText = generateArguments(command, 'code');
    const optsText = generateOptions(command, 'code');

    // Helper function to replace simple placeholders (usage, description)
    const replaceSimplePlaceholders = (value: string) => {
      return value
        .replace(/\{opencli\.current\.usage\}/g, usage)
        .replace(/\{opencli\.current\.description\}/g, description)
        // .replace(/\{opencli\.current\.flags\}/g, flags)
        .replace(/\{opencli\.current\.commands\}/g, subcommands);
    };

    // Replace placeholders in text nodes
    visit(tree, 'text', (node: any) => {
      if (typeof node.value === 'string') {
        node.value = replaceSimplePlaceholders(node.value);
        // For code style, also replace arguments/options as text
        if (indentStyle === 'code') {
          node.value = node.value
            .replace(/\{opencli\.current\.arguments\}/g, argsText)
            .replace(/\{opencli\.current\.options\}/g, optsText);
        }
      }
    });

    // Replace placeholders in inline code (backticks)
    visit(tree, 'inlineCode', (node: any) => {
      if (typeof node.value === 'string') {
        node.value = replaceSimplePlaceholders(node.value);
        if (indentStyle === 'code') {
          node.value = node.value
            .replace(/\{opencli\.current\.arguments\}/g, argsText)
            .replace(/\{opencli\.current\.options\}/g, optsText);
        }
      }
    });

    // Replace placeholders in code blocks
    visit(tree, 'code', (node: any) => {
      if (typeof node.value === 'string') {
        node.value = replaceSimplePlaceholders(node.value)
          .replace(/\{opencli\.current\.arguments\}/g, argsText)
          .replace(/\{opencli\.current\.options\}/g, optsText);
      }
    });

    // For list format, replace argument/option placeholders with mdast list nodes
    if (indentStyle === 'list') {
      // Replace {opencli.current.arguments} with list node
      visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
        if (!parent || index === undefined) return;

        const textChild = node.children?.find((c: any) =>
          c.type === 'text' && c.value?.includes('{opencli.current.arguments}')
        );

        if (textChild) {
          const listNode = createArgumentsListNode(command);
          if (listNode) {
            parent.children[index] = listNode;
          } else {
            // No arguments, just remove the placeholder
            textChild.value = textChild.value.replace('{opencli.current.arguments}', '');
          }
        }
      });

      // Replace {opencli.current.options} with list node
      visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
        if (!parent || index === undefined) return;

        const textChild = node.children?.find((c: any) =>
          c.type === 'text' && c.value?.includes('{opencli.current.options}')
        );

        if (textChild) {
          const listNode = createOptionsListNode(command);
          if (listNode) {
            parent.children[index] = listNode;
          } else {
            // No options, just remove the placeholder
            textChild.value = textChild.value.replace('{opencli.current.options}', '');
          }
        }
      });
    }
  };
}

/**
 * Load OpenCLI spec from file or URL
 */
async function loadOpencliSpec(
  source: string,
  file: VFile
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
      
      // Resolve relative to the markdown file's directory
      const resolvedPath = path.isAbsolute(source)
        ? source
        : path.resolve(file.dirname || process.cwd(), source);
      
      content = await fs.readFile(resolvedPath, 'utf-8');
    }
    
    return JSON.parse(content) as OpencliSpecJson;
  } catch (error) {
    console.error(`Error loading OpenCLI spec from ${source}:`, error);
    return null;
  }
}

/**
 * Find a command in the spec by path (e.g., "spice install")
 * If path is empty, returns a synthetic root command
 */
function findCommand(
  spec: OpencliSpecJson,
  commandPath: string
): Command | null {
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
    foundCommand = currentCommands.find(
      (cmd) => cmd.name === part || cmd.aliases?.includes(part)
    ) || null;

    if (!foundCommand) {
      return null;
    }

    // Move to subcommands for next iteration
    currentCommands = foundCommand.commands || [];
  }

  return foundCommand;
}

/**
 * Generate usage line for a command (like: "shadcn init [options] [components...]")
 */
function generateUsage(
  spec: OpencliSpecJson,
  command: Command,
  commandPath: string
): string {
  const parts: string[] = [];

  // Command path
  parts.push(commandPath);

  // Options indicator
  if (command.options && command.options.length > 0) {
    const visibleOptions = command.options.filter(opt => !opt.hidden);
    if (visibleOptions.length > 0) {
      parts.push('[options]');
    }
  }

  // Arguments
  if (command.arguments && command.arguments.length > 0) {
    const visibleArgs = command.arguments.filter(arg => !arg.hidden);
    const argParts = visibleArgs.map(arg => {
      const name = arg.name.toLowerCase();
      // Use ... suffix if argument can accept multiple values (variadic)
      const suffix = arg.variadic ? '...' : '';
      return arg.required ? `<${name}${suffix}>` : `[${name}${suffix}]`;
    });
    parts.push(...argParts);
  }

  return parts.join(' ');
}

/**
 * Generate description for a command
 */
function generateDescription(command: Command): string {
  return command.description || '';
}

/**
 * Generate arguments documentation
 * @param indentStyle - 'code' for tab-indented CLI style, 'list' for markdown list style
 */
function generateArguments(command: Command, indentStyle: 'code' | 'list' = 'code'): string {
  if (!command.arguments || command.arguments.length === 0) {
    return '';
  }

  const visibleArgs = command.arguments.filter(arg => !arg.hidden);
  if (visibleArgs.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const arg of visibleArgs) {
    const name = arg.name.toLowerCase();
    const desc = arg.description || '';

    if (indentStyle === 'list') {
      // Markdown list format: - `package`         Package name
      lines.push(`- \`${name}\`${desc ? `  ${desc}` : ''}`);
    } else {
      // Code/CLI format with tab indentation
      const paddedName = name.padEnd(30);
      lines.push(`\t${paddedName}${desc}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate options documentation
 * @param indentStyle - 'code' for tab-indented CLI style, 'list' for markdown list style
 */
function generateOptions(command: Command, indentStyle: 'code' | 'list' = 'code'): string {
  if (!command.options || command.options.length === 0) {
    return '';
  }

  const visibleOptions = command.options.filter(opt => !opt.hidden);
  if (visibleOptions.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const option of visibleOptions) {
    // Build option signature
    const aliases = option.aliases?.filter(a => a.length === 1) || [];
    const short = aliases.length > 0 ? `-${aliases[0]}` : '';
    const long = `--${option.name}`;

    // Add argument placeholder if option takes arguments
    let argPlaceholder = '';
    if (option.arguments && option.arguments.length > 0) {
      const argNames = option.arguments
        .filter(arg => !arg.hidden)
        .map(arg => `<${arg.name.toLowerCase()}>`);
      argPlaceholder = ' ' + argNames.join(' ');
    }

    const desc = option.description || '';

    if (indentStyle === 'list') {
      // Markdown list format: - `-g`, `--global`   Install globally
      const shortPart = short ? `\`${short}\`, ` : '';
      lines.push(`- ${shortPart}\`${long}\`${argPlaceholder}${desc ? `  ${desc}` : ''}`);
    } else {
      // Code/CLI format with tab indentation
      const signature = `${short ? `${short}, ` : ''}${long}${argPlaceholder}`;
      const paddedSignature = signature.padEnd(30);
      lines.push(`\t${paddedSignature}${desc}`);
    }
  }

  return lines.join('\n');
}

/**
 * TODO: OPTIONS DO ALMOST THE SAME
 * Generate flags/options documentation
 */
function generateFlags(command: Command): string {
  if (!command.options || command.options.length === 0) {
    return 'No flags available.';
  }

  const visibleOptions = command.options.filter(opt => !opt.hidden);
  if (visibleOptions.length === 0) {
    return 'No flags available.';
  }

  const lines: string[] = [];
  
  for (const option of visibleOptions) {
    const optionParts: string[] = [];
    
    // Option name and aliases
    const aliases = option.aliases?.filter(a => a.length === 1) || [];
    const short = aliases.length > 0 ? `-${aliases[0]}` : '';
    const long = `--${option.name}`;
    const name = short ? `\`${short}\`, \`${long}\`` : `\`${long}\``;
    optionParts.push(name);
    
    // Required indicator
    if (option.required) {
      optionParts.push('**(required)**');
    }
    
    lines.push(`- ${optionParts.join(' ')}`);
    
    // Description
    if (option.description) {
      lines.push(`  ${option.description}`);
    }
    
    // Option arguments
    if (option.arguments && option.arguments.length > 0) {
      const argParts = option.arguments
        .filter(arg => !arg.hidden)
        .map(arg => {
          const name = arg.name.toUpperCase();
          return arg.required ? `<${name}>` : `[${name}]`;
        });
      if (argParts.length > 0) {
        lines.push(`  Arguments: ${argParts.join(' ')}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Generate subcommands documentation
 */
function generateCommands(command: Command): string {
  if (!command.commands || command.commands.length === 0) {
    return 'No subcommands available.';
  }

  const visibleCommands = command.commands.filter(cmd => !cmd.hidden);
  if (visibleCommands.length === 0) {
    return 'No subcommands available.';
  }

  const lines: string[] = [];

  for (const subcommand of visibleCommands) {
    lines.push(`- \`${subcommand.name}\``);

    if (subcommand.aliases && subcommand.aliases.length > 0) {
      lines.push(`  Aliases: ${subcommand.aliases.map(a => `\`${a}\``).join(', ')}`);
    }

    if (subcommand.description) {
      lines.push(`  ${subcommand.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create mdast list node for arguments (for list indent style)
 */
function createArgumentsListNode(command: Command): any | null {
  if (!command.arguments || command.arguments.length === 0) {
    return null;
  }

  const visibleArgs = command.arguments.filter(arg => !arg.hidden);
  if (visibleArgs.length === 0) {
    return null;
  }

  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: visibleArgs.map(arg => ({
      type: 'listItem',
      spread: false,
      children: [{
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: arg.name.toLowerCase() },
          { type: 'text', value: arg.description ? `  ${arg.description}` : '' }
        ]
      }]
    }))
  };
}

/**
 * Create mdast list node for options (for list indent style)
 */
function createOptionsListNode(command: Command): any | null {
  if (!command.options || command.options.length === 0) {
    return null;
  }

  const visibleOptions = command.options.filter(opt => !opt.hidden);
  if (visibleOptions.length === 0) {
    return null;
  }

  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: visibleOptions.map(option => {
      const aliases = option.aliases?.filter(a => a.length === 1) || [];
      const short = aliases.length > 0 ? `-${aliases[0]}` : '';
      const long = `--${option.name}`;

      const children: any[] = [];

      // Add short alias if exists
      if (short) {
        children.push({ type: 'inlineCode', value: short });
        children.push({ type: 'text', value: ', ' });
      }

      // Add long option
      children.push({ type: 'inlineCode', value: long });

      // Add description
      if (option.description) {
        children.push({ type: 'text', value: `  ${option.description}` });
      }

      return {
        type: 'listItem',
        spread: false,
        children: [{
          type: 'paragraph',
          children
        }]
      };
    })
  };
}
