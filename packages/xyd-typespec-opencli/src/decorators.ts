import type {
  DecoratorContext,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
} from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";

import { createStateSymbol } from "./lib.js";

/** CLI info payload attached by `@cli`. */
export interface CliInfo {
  title: string;
  description?: string;
}

// --- @cli -------------------------------------------------------------------

const [getCliInfo, setCliInfo] = useStateMap<Namespace, CliInfo>(createStateSymbol("cli"));

export { getCliInfo };

export const $cli = (context: DecoratorContext, target: Namespace, info: CliInfo): void => {
  setCliInfo(context.program, target, info);
};

// --- @command ---------------------------------------------------------------

const [getCommandName, setCommandName, getCommandStateMap] = useStateMap<
  Operation,
  string | undefined
>(createStateSymbol("command"));

export { getCommandName };

export const $command = (
  context: DecoratorContext,
  target: Operation,
  name?: string,
): void => {
  setCommandName(context.program, target, name);
};

/** Whether an operation was marked with `@command`. */
export function isCommand(program: Program, op: Operation): boolean {
  return getCommandStateMap(program).has(op);
}

// --- @argument --------------------------------------------------------------

const [isArgumentState, setArgument] = useStateSet<ModelProperty>(createStateSymbol("argument"));

export const $argument = (context: DecoratorContext, target: ModelProperty): void => {
  setArgument(context.program, target);
};

export function isArgument(program: Program, prop: ModelProperty): boolean {
  return isArgumentState(program, prop);
}

// --- @option ----------------------------------------------------------------

const [isOptionState, setOption] = useStateSet<ModelProperty>(createStateSymbol("option"));

export const $option = (context: DecoratorContext, target: ModelProperty): void => {
  setOption(context.program, target);
};

export function isOption(program: Program, prop: ModelProperty): boolean {
  return isOptionState(program, prop);
}

// --- @globalOptions ---------------------------------------------------------

const [isGlobalOptionsState, setGlobalOptions] = useStateSet<Model>(
  createStateSymbol("globalOptions"),
);

export const $globalOptions = (context: DecoratorContext, target: Model): void => {
  setGlobalOptions(context.program, target);
};

export function isGlobalOptions(program: Program, model: Model): boolean {
  return isGlobalOptionsState(program, model);
}

/** Find the `@globalOptions`-marked model declared directly in a namespace. */
export function getGlobalOptionsModel(program: Program, ns: Namespace): Model | undefined {
  for (const model of ns.models.values()) {
    if (isGlobalOptions(program, model)) return model;
  }
  return undefined;
}

// --- @aka -------------------------------------------------------------------

const [getAka, setAka] = useStateMap<ModelProperty, string>(createStateSymbol("aka"));

export { getAka };

export const $aka = (
  context: DecoratorContext,
  target: ModelProperty,
  alias: string,
): void => {
  setAka(context.program, target, alias);
};

// --- @example ---------------------------------------------------------------

const [getExample, setExample] = useStateMap<ModelProperty, string>(createStateSymbol("example"));

export { getExample };

export const $example = (
  context: DecoratorContext,
  target: ModelProperty,
  value: string,
): void => {
  setExample(context.program, target, value);
};
