import { describe, expect, it } from "vitest";

import type { DefinitionProperty } from "@xyd-js/uniform";

import { commandToggleNoun } from "../src/components/ApiRef/ApiRefProperties/toggle";

// The rows as a CLI reference emits them: a command typed inside a session is
// a `command` row, its arguments and options nest under it (an option's name
// keeps its dashes), and so do its own subcommands.
const row = (name: string, type: string, properties?: DefinitionProperty[]): DefinitionProperty => ({
  name,
  type,
  description: "",
  ...(properties ? { properties } : {}),
});

const arg = row("path", "string");
const option = row("--format", "string");
const shortOption = row("-n", "string");
const sub = row("forget", "command", [row("id", "string")]);

describe("commandToggleNoun", () => {
  it("names the kinds a command row holds, in a fixed order", () => {
    expect(commandToggleNoun(row("model", "command"), [arg])).toBe("arguments");
    expect(commandToggleNoun(row("export", "command"), [option, arg])).toBe("arguments and options");
    expect(commandToggleNoun(row("memory", "command"), [sub])).toBe("subcommands");
    expect(commandToggleNoun(row("all", "command"), [sub, option, arg])).toBe(
      "arguments, options and subcommands"
    );
  });

  it("counts a short option as an option", () => {
    expect(commandToggleNoun(row("list", "command"), [shortOption])).toBe("options");
  });

  it("leaves every other row to the default wording", () => {
    expect(commandToggleNoun(row("body", "object"), [arg])).toBe("");
    expect(commandToggleNoun(row("filter", "$$union"), [arg])).toBe("");
    expect(commandToggleNoun(row("model", "command"), [])).toBe("");
  });
});
