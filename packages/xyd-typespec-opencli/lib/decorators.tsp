using TypeSpec.Reflection;

namespace XydCli;

/** Information about the CLI, mapped to the OpenCLI `info` object. */
model CliInfo {
  /** The application title (OpenCLI `info.title`). */
  title: string;

  /** A description of the application (OpenCLI `info.description`). */
  description?: string;
}

/**
 * Mark a namespace as the root of a CLI. Its `@command` operations and nested
 * namespaces become the OpenCLI command tree; a `@globalOptions` model inside
 * it becomes the root `options`.
 *
 * @param info CLI title/description → OpenCLI `info`.
 */
extern dec cli(target: Namespace, info: valueof CliInfo);

/**
 * Mark an operation as a CLI command. The operation's `@doc` becomes the
 * command description and its `@argument` parameters become positional args.
 *
 * @param name Optional command name override (defaults to the operation name).
 */
extern dec command(target: Operation, name?: valueof string);

/** Mark an operation parameter as a positional CLI argument. */
extern dec argument(target: ModelProperty);

/** Mark an operation parameter as a per-command CLI option (flag). */
extern dec option(target: ModelProperty);

/** Mark a model whose properties become the CLI's root (recursive) options. */
extern dec globalOptions(target: Model);

/**
 * Attach a short alias to an option/flag (e.g. `-h` for `--help`). Named `aka`
 * rather than `alias` because `alias` is a reserved TypeSpec keyword.
 *
 * @param aliasName The short alias, without leading dashes.
 */
extern dec aka(target: ModelProperty, aliasName: valueof string);

/**
 * Provide a representative example value for an argument, carried into the
 * OpenCLI argument `metadata` as `{ name: "example", value }`.
 *
 * @param value The example value.
 */
extern dec example(target: ModelProperty, value: valueof string);
