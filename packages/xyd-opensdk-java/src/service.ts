import type { Field, Method, NamedType, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type OperationPlan, planOperation } from '@xyd-js/opensdk-framework';
import type { GeneratedFile } from '@xyd-js/opensdk-framework';

import { constLiteral, isBinaryTypeRef, isConstField, javaDecode, javaType, queryKind } from './javatype';
import { javaDoc, javaFile } from './javawriter';
import { camelCase, javaMethodName, pascalCase, resourceQualifier, serviceTypeName } from './naming';
import type { JavaCtx } from './project';

/** The wire body encoding a method routes on: 'json' | 'multipart' | 'form'. */
export function methodEncoding(method: Method, plan: OperationPlan, types: Map<string, NamedType>): 'json' | 'multipart' | 'form' {
  let encoding = plan.encoding ?? 'json';
  // A json-labelled body that hides a binary field still needs the multipart
  // encoder (some specs declare application/json over a `format: binary` field).
  if (encoding === 'json' && requestBodyFields(method, types).some((f) => isBinaryTypeRef(f.type, types))) {
    encoding = 'multipart';
  }
  return encoding as 'json' | 'multipart' | 'form';
}

/** Whether the method carries a request body encoded as multipart or urlencoded form. */
export function methodNeedsForm(method: Method, types: Map<string, NamedType>): boolean {
  if (!method.requestBody) return false;
  return methodEncoding(method, planOperation(method, types), types) !== 'json';
}

/**
 * One `.java` file per resource service (openai-java's blocking services) plus
 * one `<Qualifier><Method>Params` builder per method that carries a body,
 * query or header input. Java is one-public-class-per-file, so — unlike the Go
 * emitter's single service file — every service and params class is its own
 * file. Class names are path-qualified (PetService, ProjectRoleService) to
 * avoid collisions across the resource tree.
 */
export function renderResourceFiles(resources: Resource[], ctx: JavaCtx): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const walk = (resource: Resource, segments: string[]) => {
    files.push(serviceFile(resource, segments, ctx));
    for (const method of resource.methods || []) {
      const paramsFile = paramsFile2(resource, segments, method, ctx);
      if (paramsFile) files.push(paramsFile);
    }
    for (const sub of resource.resources || []) walk(sub, [...segments, sub.name]);
  };
  for (const resource of resources) walk(resource, [resource.name]);
  return files;
}

// ---- params planning -------------------------------------------------------

interface ParamsPlan {
  className: string;
  bodyFields: Field[];
  query: Param[];
  header: Param[];
}

/** The params class a method needs (body + query + header), or null when it takes only path args. */
function planParams(segments: string[], method: Method, plan: OperationPlan, ctx: JavaCtx): ParamsPlan | null {
  const query = plan.paramGroups.query;
  const header = plan.paramGroups.header;
  const bodyFields = requestBodyFields(method, ctx.types);
  if (bodyFields.length === 0 && query.length === 0 && header.length === 0) return null;
  const className = `${resourceQualifier(segments)}${pascalCase(javaMethodName(method.action))}Params`;
  return { className, bodyFields, query, header };
}

function requestBodyFields(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

// ---- service file ----------------------------------------------------------

function serviceFile(resource: Resource, segments: string[], ctx: JavaCtx): GeneratedFile {
  const cls = serviceTypeName(segments);
  const subs = resource.resources || [];

  const imports = new Set<string>();
  const fieldLines = ['  private final Transport transport;'];
  for (const sub of subs) fieldLines.push(`  private final ${serviceTypeName([...segments, sub.name])} ${camelCase(sub.name)};`);

  const ctorLines = ['    this.transport = transport;'];
  for (const sub of subs) {
    ctorLines.push(`    this.${camelCase(sub.name)} = new ${serviceTypeName([...segments, sub.name])}(transport);`);
  }
  const ctor = `  ${cls}(Transport transport) {\n${ctorLines.join('\n')}\n  }`;

  const accessors = subs.map(
    (sub) =>
      `  public ${serviceTypeName([...segments, sub.name])} ${camelCase(sub.name)}() {\n    return ${camelCase(sub.name)};\n  }`,
  );

  const methods = (resource.methods || []).map((m) => methodDef(resource, segments, m, ctx, imports));

  const doc = javaDoc(resource.description);
  const head = doc ? `${doc}\n` : '';
  const members = [fieldLines.join('\n'), ctor, ...accessors, ...methods].filter(Boolean).join('\n\n');
  const body = `${head}public final class ${cls} {\n${members}\n}`;
  return { path: `${ctx.srcDir}${cls}.java`, content: javaFile(ctx.fullPackage, [...imports], body) };
}

function methodDef(
  resource: Resource,
  segments: string[],
  method: Method,
  ctx: JavaCtx,
  imports: Set<string>,
): string {
  const plan = planOperation(method, ctx.types);
  const name = javaMethodName(method.action);
  const pathParams = plan.paramGroups.path;
  const params = planParams(segments, method, plan, ctx);

  // Signature: path args (positional), then a single Params arg when present.
  const args = pathParams.map((p) => `${javaType(p.type, ctx.types)} ${camelCase(p.name)}`);
  if (params) args.push(`${params.className} params`);

  const lines: string[] = [];
  // openai-java guards required string path params before building the path.
  for (const p of pathParams) {
    if (p.type?.kind !== 'scalar' || p.type.scalar !== 'string') continue;
    const n = camelCase(p.name);
    lines.push(
      `    if (${n} == null || ${n}.isEmpty()) {\n` +
        `      throw new IllegalArgumentException(${JSON.stringify(`missing required ${p.name} parameter`)});\n` +
        `    }`,
    );
  }

  lines.push(`    Transport.Request request = new Transport.Request(${JSON.stringify(method.httpMethod.toUpperCase())}, ${pathExpr(method.path, pathParams)});`);

  // Binary download: request the primary content type (a user Accept could win in phase 2).
  if (plan.binaryContentType) {
    lines.push(`    request.accept(${JSON.stringify(plan.binaryContentType)});`);
  }

  if (params) {
    if (params.bodyFields.length > 0) {
      imports.add('java.util.LinkedHashMap');
      imports.add('java.util.Map');
      lines.push('    Map<String, Object> body = new LinkedHashMap<>();');
      for (const f of params.bodyFields) lines.push(bodyPut(f));
      lines.push('    request.body(body);');
      // Route non-json bodies (multipart/form) through the matching runtime encoder.
      const encoding = methodEncoding(method, plan, ctx.types);
      if (encoding !== 'json') lines.push(`    request.encoding(${JSON.stringify(encoding)});`);
    }
    for (const q of params.query) lines.push(queryLine(q, ctx, imports));
    for (const h of params.header) lines.push(headerLine(h));
  }

  const ret = returnPlan(method, plan, ctx);
  lines.push(ret.statement);

  const doc = javaDoc(method.description, '  ');
  const head = doc ? `${doc}\n` : '';
  return `${head}  public ${ret.type} ${name}(${args.join(', ')}) {\n${lines.join('\n')}\n  }`;
}

/**
 * The `body.put(...)` line for one request-body field. Const-valued fields are
 * auto-filled with their fixed literal (never surfaced in the params builder);
 * required fields are always sent; optional fields only when present.
 */
function bodyPut(field: Field): string {
  const member = camelCase(field.name);
  const key = JSON.stringify(field.name);
  if (isConstField(field)) return `    body.put(${key}, ${constLiteral((field.type as { const?: unknown }).const)});`;
  if (field.required) return `    body.put(${key}, params.${member}());`;
  return `    params.${member}().ifPresent(value -> body.put(${key}, value));`;
}

/**
 * The `request.query(...)` line(s) for one query param, honoring its wire name
 * and OpenAPI style/explode (mirrors the Go emitter's queryParamLines):
 *   scalar/enum — single key=value
 *   array       — explode!=false repeats the key; explode=false comma-joins
 *   map         — deepObject k[sub]=v, else a JSON-encoded value
 *   object      — JSON-encoded value
 */
function queryLine(q: Param, ctx: JavaCtx, imports: Set<string>): string {
  const member = camelCase(q.name);
  const key = q.wireName ?? q.name;
  const wire = JSON.stringify(key);
  const kind = queryKind(q.type, ctx.types);
  const deepObject = q.style === 'deepObject';

  if (kind === 'array') {
    if (q.explode === false) {
      imports.add('java.util.ArrayList');
      imports.add('java.util.List');
      // style=form, explode=false: one key with the values comma-joined.
      const join = (values: string, indent: string) =>
        `${indent}List<String> parts = new ArrayList<>();\n` +
        `${indent}for (Object value : ${values}) {\n${indent}  parts.add(String.valueOf(value));\n${indent}}\n` +
        `${indent}request.query(${wire}, String.join(",", parts));`;
      if (q.required) return `    {\n${join(`params.${member}()`, '      ')}\n    }`;
      return `    params.${member}().ifPresent(values -> {\n${join('values', '      ')}\n    });`;
    }
    if (q.required) {
      return `    for (Object value : params.${member}()) {\n      request.query(${wire}, String.valueOf(value));\n    }`;
    }
    return (
      `    params.${member}().ifPresent(values -> {\n` +
      `      for (Object value : values) {\n        request.query(${wire}, String.valueOf(value));\n      }\n` +
      `    });`
    );
  }

  if (kind === 'map') {
    if (deepObject) {
      const sub = JSON.stringify(`${key}[`);
      const forEach = `forEach((mapKey, mapValue) -> request.query(${sub} + mapKey + "]", String.valueOf(mapValue)))`;
      if (q.required) return `    params.${member}().${forEach};`;
      return `    params.${member}().ifPresent(entries -> entries.${forEach});`;
    }
    if (q.required) return `    request.query(${wire}, Json.encode(params.${member}()));`;
    return `    params.${member}().ifPresent(value -> request.query(${wire}, Json.encode(value)));`;
  }

  if (kind === 'object') {
    if (q.required) return `    request.query(${wire}, Json.encode(params.${member}()));`;
    return `    params.${member}().ifPresent(value -> request.query(${wire}, Json.encode(value)));`;
  }

  // scalar / enum
  if (q.required) return `    request.query(${wire}, String.valueOf(params.${member}()));`;
  return `    params.${member}().ifPresent(value -> request.query(${wire}, String.valueOf(value)));`;
}

/** The `request.header(...)` line(s) for one header param. */
function headerLine(h: Param): string {
  const member = camelCase(h.name);
  const wire = JSON.stringify(h.wireName ?? h.name);
  if (h.required) return `    request.header(${wire}, String.valueOf(params.${member}()));`;
  return `    params.${member}().ifPresent(value -> request.header(${wire}, String.valueOf(value)));`;
}

/** The Java return type + the terminal statement (page / decode / raw / execute-and-ignore). */
function returnPlan(method: Method, plan: OperationPlan, ctx: JavaCtx): { type: string; statement: string } {
  if (plan.binaryContentType) return { type: 'byte[]', statement: '    return transport.executeRaw(request);' };
  // A paginated list returns a vendored generic page container that decodes the
  // {data:[...], has_more:bool} envelope with a per-item decoder.
  if (plan.pageName) {
    const item = javaType(method.pagination?.itemType as TypeRef | undefined, ctx.types);
    // Decoder runs inside the `__e ->` page-item lambda below, so start at
    // depth 1 — a nested array/map itemType must not re-bind `__e`.
    const decode = javaDecode(method.pagination?.itemType as TypeRef | undefined, '__e', ctx.types, 1);
    return {
      type: `${plan.pageName}<${item}>`,
      statement: `    return ${plan.pageName}.fromJson(transport.execute(request), __e -> ${decode});`,
    };
  }
  const primary = plan.method.primaryResponse as TypeRef | undefined;
  if (!primary || plan.primaryResponse === 'none') {
    return { type: 'void', statement: '    transport.execute(request);' };
  }
  const type = javaType(primary, ctx.types);
  const decoded = javaDecode(primary, 'transport.execute(request)', ctx.types);
  // A ref whose decode is just the passthrough src (union/alias-to-Object) returns the raw JSON value.
  return { type, statement: `    return ${decoded};` };
}

/** The path as a Java string-concat expression, url-encoding each path param. */
function pathExpr(path: string, pathParams: Param[]): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!normalized.includes('{')) return JSON.stringify(normalized);
  const byName = new Map(pathParams.map((p) => [p.name, camelCase(p.name)]));
  const parts: string[] = [];
  const regex = /\{([^}]+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null = regex.exec(normalized);
  while (match !== null) {
    const literal = normalized.slice(last, match.index);
    if (literal) parts.push(JSON.stringify(literal));
    const member = byName.get(match[1]) ?? camelCase(match[1]);
    parts.push(`Transport.encodePath(${member})`);
    last = match.index + match[0].length;
    match = regex.exec(normalized);
  }
  const tail = normalized.slice(last);
  if (tail) parts.push(JSON.stringify(tail));
  return parts.join(' + ');
}

// ---- params file -----------------------------------------------------------

function paramsFile2(resource: Resource, segments: string[], method: Method, ctx: JavaCtx): GeneratedFile | null {
  const plan = planOperation(method, ctx.types);
  const params = planParams(segments, method, plan, ctx);
  if (!params) return null;

  interface Slot {
    member: string;
    type: string;
    required: boolean;
  }
  const slots: Slot[] = [];
  for (const f of params.bodyFields) {
    // Const-valued fields are auto-filled by the method (never a builder input).
    if (isConstField(f)) continue;
    slots.push({ member: camelCase(f.name), type: javaType(f.type, ctx.types), required: !!f.required });
  }
  for (const p of [...params.query, ...params.header]) {
    slots.push({ member: camelCase(p.name), type: javaType(p.type, ctx.types), required: !!p.required });
  }

  const imports: string[] = [];
  if (slots.some((s) => !s.required)) imports.push('java.util.Optional');
  if (slots.some((s) => s.type.includes('List<'))) imports.push('java.util.List');
  if (slots.some((s) => s.type.includes('Map<'))) imports.push('java.util.Map');

  const fieldDecls = slots.map((s) => `  private final ${s.type} ${s.member};`).join('\n');
  const ctorAssigns = slots.map((s) => `    this.${s.member} = builder.${s.member};`).join('\n');
  const accessors = slots
    .map((s) =>
      s.required
        ? `  public ${s.type} ${s.member}() {\n    return ${s.member};\n  }`
        : `  public Optional<${s.type}> ${s.member}() {\n    return Optional.ofNullable(${s.member});\n  }`,
    )
    .join('\n\n');

  const builderFields = slots.map((s) => `    private ${s.type} ${s.member};`).join('\n');
  const setters = slots
    .map(
      (s) =>
        `    public Builder ${s.member}(${s.type} ${s.member}) {\n      this.${s.member} = ${s.member};\n      return this;\n    }`,
    )
    .join('\n\n');
  const requiredChecks = slots
    .filter((s) => s.required)
    .map(
      (s) =>
        `      if (${s.member} == null) {\n        throw new IllegalStateException(${JSON.stringify(`${s.member} is required`)});\n      }`,
    )
    .join('\n');
  const build =
    `    public ${params.className} build() {\n` +
    (requiredChecks ? `${requiredChecks}\n` : '') +
    `      return new ${params.className}(this);\n    }`;

  const builder = `  public static final class Builder {\n${builderFields}\n\n${setters}\n\n${build}\n  }`;

  const doc = javaDoc(method.description ? `Parameters for ${javaMethodName(method.action)}: ${method.description}` : '');
  const head = doc ? `${doc}\n` : '';
  const body =
    `${head}public final class ${params.className} {\n` +
    `${fieldDecls}\n\n` +
    `  private ${params.className}(Builder builder) {\n${ctorAssigns}\n  }\n\n` +
    `  public static Builder builder() {\n    return new Builder();\n  }\n\n` +
    `${accessors}\n\n` +
    `${builder}\n}`;
  return { path: `${ctx.srcDir}${params.className}.java`, content: javaFile(ctx.fullPackage, imports, body) };
}
