import {
  type DiagnosticTarget,
  type EmitContext,
  emitFile,
  getDoc,
  getSourceLocation,
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

  const commands = buildCommands(program, cliNs, buildFileOrder(program));
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

/**
 * Deterministic cross-file ordering: map each source file to its index in
 * `program.sourceFiles`, which is insertion-ordered by import resolution — the
 * entry file, then a pre-order depth-first walk of its imports, each file added
 * on first encounter. A command's `(fileIndex, pos)` key therefore orders it by
 * the position its declaring file is *first* reached in that walk, then by its
 * position within that file. In the common shape — a `main.tsp` that imports each
 * command file exactly once — that first-reach order equals `main.tsp`'s import
 * list, so reordering the imports reorders the commands. (Cross-importing one
 * command file from another would instead order it by that earlier first-reach,
 * with no diagnostic — keep the import graph a simple fan-out from the entry.)
 * For a single-file spec every node shares one file, so the key collapses to
 * source order (`pos`) — identical to the previous pos-only behavior.
 */
type FileOrder = Map<string, number>;

function buildFileOrder(program: Program): FileOrder {
  const order: FileOrder = new Map();
  let i = 0;
  for (const path of program.sourceFiles.keys()) order.set(path, i++);
  return order;
}

/** `(fileIndex, pos)` sort key for a declaration node — see {@link FileOrder}. */
function nodeSortKey(fileOrder: FileOrder, node: DiagnosticTarget | undefined): [number, number] {
  if (!node) return [0, 0];
  // SourceLocation carries both the declaring file and the intra-file position.
  const loc = getSourceLocation(node);
  if (!loc) return [0, 0];
  return [fileOrder.get(loc.file.path) ?? 0, loc.pos];
}

/** Build the ordered command list for a namespace (ops + sub-namespaces). */
function buildCommands(program: Program, ns: Namespace, fileOrder: FileOrder): Command[] {
  const children: { key: [number, number]; build: () => Command }[] = [];

  for (const op of ns.operations.values()) {
    if (!isCommand(program, op)) continue;
    children.push({ key: nodeSortKey(fileOrder, op.node), build: () => buildLeafCommand(program, op) });
  }
  for (const sub of ns.namespaces.values()) {
    // A namespace reopened across files has one representative `.node`; its file
    // index places the whole group. Fine as long as a group's declarations are
    // contiguous in import order (the earliest reopening wins the position).
    children.push({
      key: nodeSortKey(fileOrder, sub.node),
      build: () => buildGroupCommand(program, sub, fileOrder),
    });
  }

  // Interleave commands and groups by (file import order, source position) so a
  // spec split across files still emits in the order the files are imported.
  children.sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1]);
  return children.map((c) => c.build());
}

function buildGroupCommand(program: Program, ns: Namespace, fileOrder: FileOrder): Command {
  const command: Command = { name: ns.name };
  const description = getDoc(program, ns);
  if (description) command.description = description;
  const commands = buildCommands(program, ns, fileOrder);
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
