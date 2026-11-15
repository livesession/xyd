import type { DefinitionProperty } from "@xyd-js/uniform";

/** The row type a CLI reference gives a command: a subcommand, or a command
 * typed inside the session a command opens. */
export const COMMAND_PROPERTY_TYPE = "command";

/**
 * What a command row's toggle shows, in place of "properties": a command has
 * arguments, options (the rows named `-x` or `--name`) and subcommands. Lists
 * the kinds its rows hold, in that order — `arguments`,
 * `arguments and options`, `arguments, options and subcommands`. Empty for a
 * row that is not a command, or for one with nothing to show.
 */
export function commandToggleNoun(
  parent: DefinitionProperty,
  children: DefinitionProperty[]
): string {
  if (parent?.type !== COMMAND_PROPERTY_TYPE || !children?.length) {
    return "";
  }

  let args = false;
  let options = false;
  let commands = false;
  for (const child of children) {
    if (child?.type === COMMAND_PROPERTY_TYPE) {
      commands = true;
    } else if (child?.name?.startsWith("-")) {
      options = true;
    } else {
      args = true;
    }
  }

  const nouns = [
    args ? "arguments" : "",
    options ? "options" : "",
    commands ? "subcommands" : "",
  ].filter(Boolean);

  if (nouns.length < 2) {
    return nouns.join("");
  }

  return `${nouns.slice(0, -1).join(", ")} and ${nouns[nouns.length - 1]}`;
}
