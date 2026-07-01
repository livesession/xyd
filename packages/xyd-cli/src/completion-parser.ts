import type { Argument, CliInfo, Command, OpencliSpecJson, Option } from '@xyd-js/opencli';

import type { CLI, CLIArgument, CLICommand, CLIGlobalFlag, FlagType } from './types';

/**
 * Transform the xyd CLI's declarative arg/command spec (`cliSpec`) into an
 * OpenCLI document — the single source of truth that drives both the shell
 * completions and a machine-readable description of the CLI.
 *
 * Global flags become root-level `recursive` options (available on every
 * command); each command's `usage` line yields its positional arguments.
 */
export function cliToOpencli(cli: CLI): OpencliSpecJson {
    const spec: OpencliSpecJson = {
        opencli: '1.0.0',
        info: buildInfo(cli),
    };

    const options = Object.entries(cli.globalFlags || {}).map(([name, flag]) => flagToOption(name, flag, true));
    if (options.length) spec.options = options;

    const commands = Object.entries(cli.commands || {}).map(([name, cmd]) => commandToOpencli(name, cmd));
    if (commands.length) spec.commands = commands;

    return spec;
}

function buildInfo(cli: CLI): CliInfo {
    const info: CliInfo = { title: cli.name || 'cli', version: cli.version || '0.0.0' };
    if (cli.description) info.description = cli.description;
    return info;
}

function commandToOpencli(name: string, cmd: CLICommand): Command {
    const command: Command = { name };
    if (cmd.description) command.description = cmd.description;

    // Prefer structured arguments; otherwise parse them out of the usage line.
    // A command that groups subcommands carries no positional of its own.
    const args = cmd.arguments?.length
        ? cmd.arguments.map(argToOpencli)
        : cmd.commands
            ? []
            : parseUsageArguments(cmd.usage);
    if (args.length) command.arguments = args;

    if (cmd.flags) {
        const options = Object.entries(cmd.flags)
            .filter(([, flag]) => flag && typeof flag === 'object')
            .map(([flagName, flag]) => flagToOption(flagName, flag as CLIGlobalFlag, false));
        if (options.length) command.options = options;
    }

    if (cmd.commands) {
        const subcommands = Object.entries(cmd.commands).map(([subName, sub]) => commandToOpencli(subName, sub));
        if (subcommands.length) command.commands = subcommands;
    }

    return command;
}

/** Map a declarative CLI argument to an OpenCLI argument. */
function argToOpencli(arg: CLIArgument): Argument {
    const out: Argument = { name: arg.name };
    if (arg.required) out.required = true;
    if (arg.description) out.description = arg.description;
    if (arg.acceptedValues?.length) out.acceptedValues = arg.acceptedValues;
    // Carry the example via metadata so the generated invocation shows a real
    // value (e.g. `./path-to-docs`) instead of a generic placeholder.
    if (arg.example != null) out.metadata = [{ name: 'example', value: arg.example }];
    return out;
}

function flagToOption(name: string, flag: CLIGlobalFlag, recursive: boolean): Option {
    const option: Option = { name };
    if (flag.alias) option.aliases = [flag.alias];
    if (flag.description) option.description = flag.description;
    // Non-boolean flags take a value (e.g. `--port <number>`).
    if (flag.type && flag.type !== 'Boolean') {
        option.arguments = [{ name: valueLabel(flag.type) }];
    }
    if (recursive) option.recursive = true;
    return option;
}

function valueLabel(type: FlagType): string {
    return type === 'Number' ? 'number' : 'string';
}

const META_TOKENS = new Set(['flags', 'globalflags', 'options', 'subcommand', 'command', 'args']);

/** Positional arguments parsed from a usage line, e.g. `xyd migrateme <resource> [flags]`. */
export function parseUsageArguments(usage: string | undefined): Argument[] {
    if (!usage) return [];
    const args: Argument[] = [];
    for (const token of usage.trim().split(/\s+/)) {
        const required = token.startsWith('<') && token.endsWith('>');
        const optional = token.startsWith('[') && token.endsWith(']');
        if (!required && !optional) continue;
        let inner = token.slice(1, -1).trim();
        if (inner.endsWith('...')) inner = inner.slice(0, -3).trim();
        if (!inner || inner.startsWith('-') || META_TOKENS.has(inner.toLowerCase())) continue;
        const arg: Argument = { name: inner };
        if (required) arg.required = true;
        args.push(arg);
    }
    return args;
}
