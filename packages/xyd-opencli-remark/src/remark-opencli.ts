import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { Root } from 'mdast';
import { matter } from 'vfile-matter';
import { load } from 'js-yaml';

import {
  loadOpencliSpec,
  findCommand,
  generateUsage,
  generateDescription,
  generateArguments,
  generateOptions,
  generateCommands,
  type Command,
} from '@xyd-js/opencli';

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

    // Load OpenCLI spec (resolve relative file paths from the markdown file's dir)
    const spec = await loadOpencliSpec(cliConfig.source, { cwd: file.dirname });
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

    // In an MDX pipeline `{opencli.current.*}` is parsed as a JS expression node
    // (mdxFlowExpression / mdxTextExpression), not literal text — so the visitors
    // above never see it (and it would throw at render since `opencli` is undefined).
    // Resolve those expression nodes here.
    const mdxExprValue = (expr: string): string | null => {
      switch (expr) {
        case 'opencli.current.usage': return usage;
        case 'opencli.current.description': return description;
        case 'opencli.current.commands': return subcommands;
        case 'opencli.current.arguments': return argsText;
        case 'opencli.current.options': return optsText;
        default: return null;
      }
    };
    visit(tree, ['mdxFlowExpression', 'mdxTextExpression'], (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined || typeof node.value !== 'string') return;
      const expr = node.value.trim();
      if (!expr.startsWith('opencli.current.')) return;

      if (indentStyle === 'list' && (expr === 'opencli.current.arguments' || expr === 'opencli.current.options')) {
        const listNode = expr === 'opencli.current.arguments'
          ? createArgumentsListNode(command)
          : createOptionsListNode(command);
        parent.children[index] = listNode || { type: 'text', value: '' };
        return;
      }

      const value = mdxExprValue(expr);
      if (value === null) return;

      if (node.type === 'mdxFlowExpression') {
        parent.children[index] = expr === 'opencli.current.description'
          ? { type: 'paragraph', children: [{ type: 'text', value }] }
          : { type: 'code', value };
      } else {
        parent.children[index] = { type: 'text', value };
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
