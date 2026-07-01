import type { OpencliSpecJson, Command } from './types.js';

export type IndentStyle = 'code' | 'list';

/**
 * Generate usage line for a command (like: "shadcn init [options] [components...]")
 */
export function generateUsage(_spec: OpencliSpecJson, command: Command, commandPath: string): string {
  const parts: string[] = [];

  // Command path
  parts.push(commandPath);

  // A command that owns subcommands takes one as its next token.
  if (command.commands && command.commands.filter((c) => !c.hidden).length > 0) {
    parts.push('<command>');
  }

  // Options indicator
  if (command.options && command.options.length > 0) {
    const visibleOptions = command.options.filter((opt) => !opt.hidden);
    if (visibleOptions.length > 0) {
      parts.push('[options]');
    }
  }

  // Arguments
  if (command.arguments && command.arguments.length > 0) {
    const visibleArgs = command.arguments.filter((arg) => !arg.hidden);
    const argParts = visibleArgs.map((arg) => {
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
export function generateDescription(command: Command): string {
  return command.description || '';
}

/**
 * Generate arguments documentation
 * @param indentStyle - 'code' for tab-indented CLI style, 'list' for markdown list style
 */
export function generateArguments(command: Command, indentStyle: IndentStyle = 'code'): string {
  if (!command.arguments || command.arguments.length === 0) {
    return '';
  }

  const visibleArgs = command.arguments.filter((arg) => !arg.hidden);
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
export function generateOptions(command: Command, indentStyle: IndentStyle = 'code'): string {
  if (!command.options || command.options.length === 0) {
    return '';
  }

  const visibleOptions = command.options.filter((opt) => !opt.hidden);
  if (visibleOptions.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const option of visibleOptions) {
    // Build option signature
    const aliases = option.aliases?.filter((a) => a.length === 1) || [];
    const short = aliases.length > 0 ? `-${aliases[0]}` : '';
    const long = `--${option.name}`;

    // Add argument placeholder if option takes arguments
    let argPlaceholder = '';
    if (option.arguments && option.arguments.length > 0) {
      const argNames = option.arguments.filter((arg) => !arg.hidden).map((arg) => `<${arg.name.toLowerCase()}>`);
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
export function generateFlags(command: Command): string {
  if (!command.options || command.options.length === 0) {
    return 'No flags available.';
  }

  const visibleOptions = command.options.filter((opt) => !opt.hidden);
  if (visibleOptions.length === 0) {
    return 'No flags available.';
  }

  const lines: string[] = [];

  for (const option of visibleOptions) {
    const optionParts: string[] = [];

    // Option name and aliases
    const aliases = option.aliases?.filter((a) => a.length === 1) || [];
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
        .filter((arg) => !arg.hidden)
        .map((arg) => {
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
export function generateCommands(command: Command): string {
  if (!command.commands || command.commands.length === 0) {
    return 'No subcommands available.';
  }

  const visibleCommands = command.commands.filter((cmd) => !cmd.hidden);
  if (visibleCommands.length === 0) {
    return 'No subcommands available.';
  }

  const lines: string[] = [];

  for (const subcommand of visibleCommands) {
    lines.push(`- \`${subcommand.name}\``);

    if (subcommand.aliases && subcommand.aliases.length > 0) {
      lines.push(`  Aliases: ${subcommand.aliases.map((a) => `\`${a}\``).join(', ')}`);
    }

    if (subcommand.description) {
      lines.push(`  ${subcommand.description}`);
    }
  }

  return lines.join('\n');
}
