import {
  type EmitContext,
  emitFile,
  getDoc,
  type Namespace,
  type ModelProperty,
  type Operation,
  type Program,
  resolvePath,
  type Type,
} from "@typespec/compiler";

import type {
  Argument,
  CliInfo as OpenCliInfo,
  Command,
  OpencliSpecJson,
  Option,
} from "@xyd-js/opencli";

import {
  type CliInfo,
  getAka,
  getCliInfo,
  getCommandName,
  getExample,
  getGlobalOptionsModel,
  isArgument,
  isCommand,
} from "./decorators.js";
import { reportDiagnostic, type XydCliEmitterOptions } from "./lib.js";

export async function $onEmit(context: EmitContext<XydCliEmitterOptions>): Promise<void> {
  const { program } = context;

  const cliNs = findCliNamespace(program, program.getGlobalNamespaceType());
  if (!cliNs) {
    reportDiagnostic(program, {
      code: "missing-cli-namespace",
      target: program.getGlobalNamespaceType(),
    });
    return;
  }

  const info = getCliInfo(program, cliNs)!;

  // Keys are inserted in the exact order the current OpenCLI document uses so
  // that `JSON.stringify` reproduces it byte-for-byte.
  const doc: OpencliSpecJson = {
    opencli: "1.0.0",
    info: buildInfo(info, context.options.version),
  };

  const options = buildRootOptions(program, cliNs);
  if (options.length) doc.options = options;

  const commands = buildCommands(program, cliNs);
  if (commands.length) doc.commands = commands;

  await emitFile(program, {
    path: resolvePath(context.emitterOutputDir, "opencli.json"),
    content: JSON.stringify(doc, null, 2) + "\n",
  });
}

/** Depth-first search for the first namespace marked with `@cli`. */
function findCliNamespace(program: Program, ns: Namespace): Namespace | undefined {
  if (getCliInfo(program, ns)) return ns;
  for (const sub of ns.namespaces.values()) {
    const found = findCliNamespace(program, sub);
    if (found) return found;
  }
  return undefined;
}

function buildInfo(info: CliInfo, version: string | undefined): OpenCliInfo {
  const out: OpenCliInfo = { title: info.title, version: version ?? "0.0.0" };
  if (info.description) out.description = info.description;
  return out;
}

function buildRootOptions(program: Program, cliNs: Namespace): Option[] {
  const model = getGlobalOptionsModel(program, cliNs);
  if (!model) return [];
  const options: Option[] = [];
  for (const prop of model.properties.values()) {
    options.push(buildOption(program, prop, true));
  }
  return options;
}

function buildOption(program: Program, prop: ModelProperty, recursive: boolean): Option {
  const option: Option = { name: prop.name };
  const alias = getAka(program, prop);
  if (alias) option.aliases = [alias];
  const description = getDoc(program, prop);
  if (description) option.description = description;
  const label = valueLabel(prop.type);
  if (label) option.arguments = [{ name: label }];
  if (recursive) option.recursive = true;
  return option;
}

/**
 * A value label for a non-boolean flag argument. Boolean flags take no value
 * (returns `undefined` → the `arguments` key is omitted).
 */
function valueLabel(type: Type): string | undefined {
  if (type.kind === "Scalar" && type.name === "boolean") return undefined;
  if (type.kind === "Scalar" && isNumericScalar(type.name)) return "number";
  return "string";
}

function isNumericScalar(name: string): boolean {
  return /^(u?int|integer|float|decimal|numeric|safeint)/.test(name);
}

/** Build the ordered command list for a namespace (ops + sub-namespaces, in source order). */
function buildCommands(program: Program, ns: Namespace): Command[] {
  const children: { pos: number; build: () => Command }[] = [];

  for (const op of ns.operations.values()) {
    if (!isCommand(program, op)) continue;
    children.push({ pos: op.node?.pos ?? 0, build: () => buildLeafCommand(program, op) });
  }
  for (const sub of ns.namespaces.values()) {
    children.push({ pos: sub.node?.pos ?? 0, build: () => buildGroupCommand(program, sub) });
  }

  // Interleave commands and groups in source-declaration order.
  children.sort((a, b) => a.pos - b.pos);
  return children.map((c) => c.build());
}

function buildGroupCommand(program: Program, ns: Namespace): Command {
  const command: Command = { name: ns.name };
  const description = getDoc(program, ns);
  if (description) command.description = description;
  const commands = buildCommands(program, ns);
  if (commands.length) command.commands = commands;
  return command;
}

function buildLeafCommand(program: Program, op: Operation): Command {
  const command: Command = { name: getCommandName(program, op) ?? op.name };
  const description = getDoc(program, op);
  if (description) command.description = description;
  const args = buildArguments(program, op);
  if (args.length) command.arguments = args;
  return command;
}

function buildArguments(program: Program, op: Operation): Argument[] {
  const args: Argument[] = [];
  for (const prop of op.parameters.properties.values()) {
    if (!isArgument(program, prop)) continue;
    args.push(buildArgument(program, prop));
  }
  return args;
}

function buildArgument(program: Program, prop: ModelProperty): Argument {
  const arg: Argument = { name: prop.name };
  if (!prop.optional) arg.required = true;
  const description = getDoc(program, prop);
  if (description) arg.description = description;
  const accepted = acceptedValues(prop.type);
  if (accepted.length) arg.acceptedValues = accepted;
  const example = getExample(program, prop);
  if (example != null) arg.metadata = [{ name: "example", value: example }];
  return arg;
}

/**
 * String-literal union members → the argument's accepted values, in source
 * order. A bare single string literal (`"opensdk"`, which TypeSpec models as a
 * StringLiteral rather than a one-member Union) yields a single accepted value.
 */
function acceptedValues(type: Type): string[] {
  if (type.kind === "String") return [type.value];
  if (type.kind !== "Union") return [];
  const values: string[] = [];
  for (const variant of type.variants.values()) {
    if (variant.type.kind === "String") values.push(variant.type.value);
  }
  return values;
}
