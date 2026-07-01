export type Shell = 'zsh' | 'fish';

/** A flag/option, normalized for completion generation. */
export interface CompletionOption {
  /** Flag spellings, e.g. `['-h', '--help']`. */
  flags: string[];
  /** Whether the flag consumes a value (`--port <n>`) vs. a switch. */
  takesValue: boolean;
  description?: string;
}

/** A command node (the CLI root or a subcommand) the generators walk. */
export interface CompletionNode {
  name: string;
  description?: string;
  options: CompletionOption[];
  /** Subcommands keyed by name. */
  commands: Record<string, CompletionNode>;
}
