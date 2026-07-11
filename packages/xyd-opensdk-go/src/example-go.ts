// The generated SDK's OWN test suite (goEmitter.generateTests), openai-go-shaped:
// one external `package <pkg>_test` file per top-level resource with one Test
// func per method across the whole subtree, plus the vendored internal/testutil.
//
// Example VALUES come from the shared, language-neutral planner
// (planMethodExample / planExample from the framework) so the Go and Python
// suites exercise identical shapes; THIS file only RENDERS that neutral tree
// into compilable Go — mirroring the SAME param-struct field types the service
// emitter declares (param.Opt for optional scalars, plain for the rest), so the
// whole spec compiles.
import type { EnumValue, Field, Method, NamedType, OpensdkSpecJson, Param, TypeRef } from '@xyd-js/opensdk-core';
import type {
  BodyEncoding,
  ExampleValue,
  GeneratedFile,
  NeutralTypeField,
  NeutralTypeReference,
  OperationPlan,
  RenderedTypeField,
  RenderedTypeReference,
} from '@xyd-js/opensdk-framework';
import { planExample, planMethodExample, planOperation, planTypeReference, realisticLiteral, refSchemaName } from '@xyd-js/opensdk-framework';

import { goType, isBinaryRef, isScalarRef } from './gotype';
import { goFile, Imports } from './gowriter';
import { goConstLiteral, goEnumConstName, isConstField } from './model';
import { goMethodName, goVar, pascalCase, slug } from './naming';
import { planParams, queryKind, resourceQualifier } from './service';
import type { GoCtx } from './service';

/**
 * The render context threaded through the test emitter: the symbol table, the
 * module path (to add the vendored sub-package imports), the ROOT package
 * qualifier (the package clause of the generated SDK — NOT necessarily the
 * module's last path segment), the option-package qualifier, and the per-file
 * import set the rendered code contributes to.
 */
export interface GoExampleCtx {
  types: Map<string, NamedType>;
  modulePath: string;
  pkgQ: string;
  optionQ: string;
  imports: Imports;
}

/** The `param` package qualifier, imported on demand. */
function paramQ(ctx: GoExampleCtx): string {
  return ctx.imports.add(`${ctx.modulePath}/packages/param`);
}

/**
 * Render a language-neutral ExampleValue into a compilable Go expression.
 * Container element types and named-type references are resolved so the result
 * is self-typed (e.g. `[]string{"x"}`, `pkg.Thing{Field: 1}`); enum values
 * become the generated Go const identifier; binary becomes an io.Reader.
 */
export function renderGoExample(value: ExampleValue, ctx: GoExampleCtx): string {
  switch (value.kind) {
    case 'string':
      return JSON.stringify(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return String(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'nil';
    case 'binary':
      ctx.imports.add('io');
      ctx.imports.add('bytes');
      return 'io.Reader(bytes.NewBuffer([]byte("Example data")))';
    case 'enum':
      return renderEnumConst(value.typeName, value.value, ctx);
    case 'const':
      return goConstLiteral(value.value);
    case 'array':
      return `[]${goTypeOfExample(value.item, ctx)}{${renderGoExample(value.item, ctx)}}`;
    case 'map':
      return `map[string]${goTypeOfExample(value.value, ctx)}{"key": ${renderGoExample(value.value, ctx)}}`;
    case 'object':
      return renderObjectExample(value, ctx);
    case 'union':
      // Our unions are `interface{}`: any value satisfies the field, so emit the
      // concrete variant expression directly (nil when it bottoms out at `any`).
      return renderGoExample(value.variant, ctx);
    case 'any':
      return 'nil';
    default:
      return 'nil';
  }
}

function renderObjectExample(value: Extract<ExampleValue, { kind: 'object' }>, ctx: GoExampleCtx): string {
  if (!value.typeName) return 'map[string]any{}';
  const typeQ = `${ctx.pkgQ}.${pascalCase(value.typeName)}`;
  if (value.fields.length === 0) return `${typeQ}{}`;
  // Nested request structs (types.go) carry PLAIN fields — no param.Opt. Render
  // each field against its DECLARED TypeRef so a bottomed-out example (depth cap
  // / unresolved ref) becomes the field's Go zero value, never an invalid `nil`.
  const named = ctx.types.get(value.typeName);
  const byName = new Map((named?.fields ?? []).map((f) => [f.name, f.type as TypeRef | undefined]));
  const parts = value.fields.map((f) => `${pascalCase(f.name)}: ${renderRefValue(byName.get(f.name), f.value, ctx)}`);
  return `${typeQ}{${parts.join(', ')}}`;
}

function renderEnumConst(typeName: string, rawValue: unknown, ctx: GoExampleCtx): string {
  const named = ctx.types.get(typeName);
  const ev: EnumValue = named?.values?.find((v) => v.value === rawValue) ?? ({ value: rawValue } as EnumValue);
  return `${ctx.pkgQ}.${goEnumConstName(typeName, ev)}`;
}

/** The Go type of an ExampleValue — used for self-typed container/map literals. */
function goTypeOfExample(value: ExampleValue, ctx: GoExampleCtx): string {
  switch (value.kind) {
    case 'string':
      return 'string';
    case 'integer':
      return 'int64';
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'binary':
      return 'io.Reader';
    case 'enum':
      return `${ctx.pkgQ}.${pascalCase(value.typeName)}`;
    case 'const':
      return typeof value.value === 'number'
        ? Number.isInteger(value.value)
          ? 'int64'
          : 'float64'
        : typeof value.value === 'boolean'
          ? 'bool'
          : 'string';
    case 'array':
      return `[]${goTypeOfExample(value.item, ctx)}`;
    case 'map':
      return `map[string]${goTypeOfExample(value.value, ctx)}`;
    case 'object':
      return value.typeName ? `${ctx.pkgQ}.${pascalCase(value.typeName)}` : 'map[string]any';
    case 'union':
      return `${ctx.pkgQ}.${pascalCase(value.typeName)}`;
    default:
      return 'any';
  }
}

/** goType with named refs QUALIFIED by the root package (for `param.NewOpt[T]`). */
function goTypeQualified(ref: TypeRef | undefined, ctx: GoExampleCtx): string {
  if (!ref) return 'any';
  switch (ref.kind) {
    case 'scalar':
      return goType(ref);
    case 'ref':
      return ref.name ? `${ctx.pkgQ}.${pascalCase(ref.name)}` : 'any';
    case 'array':
      return `[]${goTypeQualified(ref.items as TypeRef | undefined, ctx)}`;
    case 'map':
      return `map[string]${goTypeQualified(ref.values as TypeRef | undefined, ctx)}`;
    default:
      return 'any';
  }
}

/**
 * Render an example value against its DECLARED TypeRef, so container element
 * types are exact and a bottomed-out example (kind 'any'/'null' from the depth
 * cap or an unresolved ref) falls back to the Go ZERO value the field accepts —
 * the invariant that keeps the whole spec compiling.
 */
function renderRefValue(ref: TypeRef | undefined, value: ExampleValue, ctx: GoExampleCtx): string {
  if (!ref) return renderGoExample(value, ctx);
  if (value.kind === 'any' || value.kind === 'null') return zeroValueForRef(ref, ctx);
  switch (ref.kind) {
    case 'array':
      if (value.kind !== 'array') return zeroValueForRef(ref, ctx);
      return `[]${goTypeQualified(ref.items as TypeRef | undefined, ctx)}{${renderRefValue(ref.items as TypeRef | undefined, value.item, ctx)}}`;
    case 'map':
      if (value.kind !== 'map') return zeroValueForRef(ref, ctx);
      return `map[string]${goTypeQualified(ref.values as TypeRef | undefined, ctx)}{"key": ${renderRefValue(ref.values as TypeRef | undefined, value.value, ctx)}}`;
    case 'ref': {
      const named = ref.name ? ctx.types.get(ref.name) : undefined;
      if (!named) return renderGoExample(value, ctx);
      if (named.kind === 'alias') return renderRefValue(named.of as TypeRef | undefined, value, ctx);
      if (named.kind === 'union') {
        // Our unions are `interface{}`: render the first variant against its own
        // TypeRef (the concrete value is assignable to the interface field).
        if (value.kind !== 'union') return zeroValueForRef(ref, ctx);
        return renderRefValue((named.variants || [])[0] as TypeRef | undefined, value.variant, ctx);
      }
      if (named.kind === 'enum') return renderGoExample(value, ctx);
      if (value.kind !== 'object') return zeroValueForRef(ref, ctx);
      return renderObjectExample(value, ctx);
    }
    default:
      // A binary reached through a TypeRef is always a `string` Go field — the
      // io.Reader form is exclusively the multipart top-level field, which
      // bodyFieldExpr renders directly (never via here).
      if (isBinaryRef(ref)) return JSON.stringify('Example data');
      // scalar / const render safely from the value alone.
      return renderGoExample(value, ctx);
  }
}

/** The compilable Go ZERO value for a TypeRef (the fallback for empty examples). */
function zeroValueForRef(ref: TypeRef | undefined, ctx: GoExampleCtx): string {
  if (!ref) return 'nil';
  switch (ref.kind) {
    case 'scalar':
      if (ref.const !== undefined) return goConstLiteral(ref.const);
      if (ref.scalar === 'integer' || ref.scalar === 'number') return '0';
      if (ref.scalar === 'boolean') return 'false';
      return '""'; // string (incl. a non-multipart binary, which is a string field)
    case 'array':
    case 'map':
      return 'nil';
    case 'ref': {
      const named = ref.name ? ctx.types.get(ref.name) : undefined;
      if (!named) return 'nil';
      if (named.kind === 'enum') return named.base === 'integer' ? '0' : '""';
      if (named.kind === 'union') return 'nil';
      if (named.kind === 'alias') return zeroValueForRef(named.of as TypeRef | undefined, ctx);
      return `${ctx.pkgQ}.${pascalCase(ref.name as string)}{}`; // struct
    }
    default:
      return 'nil';
  }
}

// ---- params-struct assembly ----------------------------------------------

/** Whether the method's signature carries a params struct (mirrors planParams). */
function hasParamsStruct(method: Method, op: OperationPlan): boolean {
  return op.hasBody || (method.queryParams?.length ?? 0) > 0 || (method.headerParams?.length ?? 0) > 0;
}

/** Resolve a request body's fields (mirrors service.ts bodyFields). */
function bodyFieldList(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/** One request-body field literal, matching bodyFieldLine's Go field type. */
function bodyFieldExpr(f: Field, encoding: string, withOptional: boolean, ctx: GoExampleCtx, realistic: boolean): string {
  if (encoding === 'multipart' && isBinaryRef(f.type)) {
    ctx.imports.add('io');
    ctx.imports.add('bytes');
    return 'io.Reader(bytes.NewBuffer([]byte("Example data")))';
  }
  const value =
    (realistic ? realisticLiteral(f.type as TypeRef, f.default) : undefined) ??
    planExample(f.type as TypeRef, ctx.types, { withOptional, realistic });
  // A binary field in a non-multipart body is a plain `string` field — renderRefValue
  // maps a binary TypeRef to a string literal, so no special-casing here.
  // Const fields stay plain scalars even when optional (bodyFieldLine) — never param.Opt.
  if (isConstField(f)) return renderRefValue(f.type as TypeRef, value, ctx);
  if (!f.required && isScalarRef(f.type)) {
    return `${paramQ(ctx)}.NewOpt[${goTypeQualified(f.type, ctx)}](${renderRefValue(f.type as TypeRef, value, ctx)})`;
  }
  return renderRefValue(f.type as TypeRef, value, ctx);
}

/** One query-param field literal, matching queryFieldLine's Go field type. */
function queryFieldExpr(q: Param, withOptional: boolean, ctx: GoExampleCtx, realistic: boolean): string {
  const kind = queryKind(q.type as TypeRef | undefined, ctx.types);
  const value =
    (realistic ? realisticLiteral(q.type as TypeRef, q.example, q.default) : undefined) ??
    planExample(q.type as TypeRef, ctx.types, { withOptional, stringHint: q.name, realistic });
  if (kind === 'array' || kind === 'map') return renderRefValue(q.type as TypeRef, value, ctx);
  if (kind === 'object') {
    const base = goType(q.type);
    if (q.required || base === 'any') return renderRefValue(q.type as TypeRef, value, ctx);
    // optional object query field is `*Base`: address a struct literal, else nil.
    if (value.kind === 'object' && value.typeName) return `&${renderRefValue(q.type as TypeRef, value, ctx)}`;
    return 'nil';
  }
  if (q.required) return renderRefValue(q.type as TypeRef, value, ctx);
  return `${paramQ(ctx)}.NewOpt[${goTypeQualified(q.type, ctx)}](${renderRefValue(q.type as TypeRef, value, ctx)})`;
}

/** One header-param field literal, matching headerFieldLine's Go field type. */
function headerFieldExpr(h: Param, withOptional: boolean, ctx: GoExampleCtx, realistic: boolean): string {
  const value =
    (realistic ? realisticLiteral(h.type as TypeRef, h.example, h.default) : undefined) ??
    planExample(h.type as TypeRef, ctx.types, { withOptional, stringHint: h.name, realistic });
  if (h.required) return renderRefValue(h.type as TypeRef, value, ctx);
  return `${paramQ(ctx)}.NewOpt[${goTypeQualified(h.type, ctx)}](${renderRefValue(h.type as TypeRef, value, ctx)})`;
}

/** The `Field: expr` lines of a params struct, in the emitted struct's order. */
function paramFieldLiterals(
  method: Method,
  op: OperationPlan,
  withOptional: boolean,
  ctx: GoExampleCtx,
  realistic: boolean,
): string[] {
  const encoding = op.encoding ?? 'json';
  const lits: string[] = [];
  if (op.hasBody) {
    for (const f of bodyFieldList(method, ctx.types)) {
      if (!f.required && !withOptional) continue;
      lits.push(`${pascalCase(f.name)}: ${bodyFieldExpr(f, encoding, withOptional, ctx, realistic)}`);
    }
  }
  for (const q of method.queryParams || []) {
    if (!q.required && !withOptional) continue;
    lits.push(`${pascalCase(q.name)}: ${queryFieldExpr(q, withOptional, ctx, realistic)}`);
  }
  for (const h of method.headerParams || []) {
    if (!h.required && !withOptional) continue;
    lits.push(`${pascalCase(h.name)}: ${headerFieldExpr(h, withOptional, ctx, realistic)}`);
  }
  return lits;
}

interface ParamsExpr {
  text: string;
  multiline: boolean;
}

/** The params-struct call argument, or null when the method takes none. */
function paramsStructExpr(
  segments: string[],
  method: Method,
  op: OperationPlan,
  withOptional: boolean,
  methodName: string,
  ctx: GoExampleCtx,
  realistic = false,
): ParamsExpr | null {
  if (!hasParamsStruct(method, op)) return null;
  const typeQ = `${ctx.pkgQ}.${resourceQualifier(segments)}${methodName}Params`;
  const fieldLits = paramFieldLiterals(method, op, withOptional, ctx, realistic);
  if (fieldLits.length === 0) return { text: `${typeQ}{}`, multiline: false };
  const body = fieldLits.map((l) => `\t${l},`).join('\n');
  return { text: `${typeQ}{\n${body}\n}`, multiline: true };
}

// ---- test-function assembly ----------------------------------------------

/** Prefix every line of a (possibly multi-line) block with `tabs` tab stops. */
function indentBlock(text: string, tabs: number): string {
  const pad = '\t'.repeat(tabs);
  return text
    .split('\n')
    .map((l) => (l ? pad + l : l))
    .join('\n');
}

/** A call statement (one tab-indented), args on their own lines when multi-line. */
function callStatement(bind: string, chain: string, methodName: string, args: string[], multiline: boolean): string {
  const call = `${chain}.${methodName}`;
  if (!multiline) return `\t${bind} ${call}(${args.join(', ')})`;
  const inner = args.map((a) => indentBlock(a, 2)).join(',\n');
  return `\t${bind} ${call}(\n${inner},\n\t)`;
}

/** Whether the method returns a value (drives `_, err :=` vs `err :=`). */
function methodHasResult(method: Method, op: OperationPlan): boolean {
  return (
    op.binaryContentType != null ||
    op.pageName != null ||
    (method.primaryResponse != null && op.primaryResponse !== 'none')
  );
}

/** The `client.<Field>.<Sub>…` receiver chain — the generated client, exactly. */
function clientChain(segments: string[]): string {
  return `client.${segments.map(pascalCase).join('.')}`;
}

// ---- type reference (Atlas SDK-types view) -------------------------------

/** The params-struct Go field type — mirrors bodyFieldLine/queryFieldLine/
 * headerFieldLine (service.ts), minus the Imports tracking (display string). */
function goFieldTypeDisplay(f: NeutralTypeField, encoding: BodyEncoding | null, types: Map<string, NamedType>): string {
  const base = goType(f.typeRef);
  if (f.in === 'query') {
    const kind = queryKind(f.typeRef, types);
    if (kind === 'array' || kind === 'map') return base;
    if (kind === 'object') return f.required || base === 'any' ? base : `*${base}`;
    return f.required ? base : `param.Opt[${base}]`;
  }
  if (f.in === 'header') return f.required ? base : `param.Opt[${base}]`;
  // body
  if (encoding === 'multipart' && isBinaryRef(f.typeRef)) return 'io.Reader';
  if (f.typeRef.const !== undefined) return base;
  if (!f.required && isScalarRef(f.typeRef)) return `param.Opt[${base}]`;
  return base;
}

function goRenderField(f: NeutralTypeField, encoding: BodyEncoding | null, types: Map<string, NamedType>): RenderedTypeField {
  return {
    name: pascalCase(f.logicalName),
    langType: goFieldTypeDisplay(f, encoding, types),
    required: f.required,
    description: f.description,
    deprecated: f.deprecated,
    refTypeName: refSchemaName(f.typeRef),
  };
}

/** The parenthesized Go return, name-stripped for a display signature
 * (`(*Response, error)`) — mirrors returnSignature (service.ts). */
function goReturnDisplay(method: Method, op: OperationPlan): string {
  if (op.binaryContentType) return '(*http.Response, error)';
  if (op.pageName) return `(*pagination.${op.pageName}[${goType(method.pagination?.itemType as TypeRef | undefined)}], error)`;
  const ref = method.primaryResponse as TypeRef | undefined;
  if (!ref || op.primaryResponse === 'none') return 'error';
  if (op.primaryResponse === 'struct') return `(*${goType(ref)}, error)`;
  return `(${goType(ref)}, error)`;
}

function goResponse(method: Method, op: OperationPlan, neutral: NeutralTypeReference, types: Map<string, NamedType>): RenderedTypeReference['response'] {
  if (op.binaryContentType) return { langType: '*http.Response', note: `binary download (${op.binaryContentType})` };
  const ref = neutral.response.typeRef;
  if (!ref || op.primaryResponse === 'none') return { langType: 'error', note: 'no response body' };
  const typeName = goType(ref);
  const note = op.pageName ? `paginated (pagination.${op.pageName})` : undefined;
  if (neutral.response.fields) {
    return {
      typeName,
      note,
      fields: neutral.response.fields.map((f) => ({
        name: pascalCase(f.logicalName),
        langType: goType(f.typeRef),
        required: f.required,
        description: f.description,
        deprecated: f.deprecated,
        refTypeName: refSchemaName(f.typeRef),
      })),
    };
  }
  return { typeName, langType: typeName, note };
}

/**
 * The per-operation TYPE REFERENCE for Go: the method signature, the request
 * params type's field rows, and the response type — the SDK-native view Atlas
 * renders in place of the REST param definitions.
 */
export function generateGoTypeReference(method: Method, segments: string[], gctx: GoCtx): RenderedTypeReference {
  const types = gctx.types;
  const op = planOperation(method, types);
  const neutral = planTypeReference(method, types);
  const methodName = goMethodName(method.action);
  const plan = planParams(segments, methodName, op.hasBody, op.paramGroups.query, op.paramGroups.header);

  const requestFields = neutral.request.fields.map((f) => goRenderField(f, op.encoding, types));

  const argNames = ['ctx', ...op.paramGroups.path.map((p) => goVar(p.name))];
  if (plan) argNames.push(plan.argName);
  const signature = `${clientChain(segments)}.${methodName}(${argNames.join(', ')}) ${goReturnDisplay(method, op)}`;

  return {
    signature,
    request: { typeName: plan?.typeName, argName: plan?.argName, fields: requestFields },
    response: goResponse(method, op, neutral, types),
  };
}

/** The typed-error check block (one tab-indented), openai-go shaped. */
function errorCheckBlock(ctx: GoExampleCtx): string {
  const reqQ = ctx.imports.add(`${ctx.modulePath}/internal/requestconfig`);
  ctx.imports.add('errors');
  return [
    `\tif err != nil {`,
    `\t\tvar apierr *${reqQ}.APIError`,
    `\t\tif errors.As(err, &apierr) {`,
    `\t\t\tt.Log(apierr.Error())`,
    `\t\t}`,
    `\t\tt.Fatalf("err should be nil: %s", err.Error())`,
    `\t}`,
  ].join('\n');
}

/** The `client := <pkg>.NewClient(WithBaseURL(baseURL), WithAPIKey(...))` block. */
function clientBlock(ctx: GoExampleCtx): string {
  return [
    `\tclient := ${ctx.pkgQ}.NewClient(`,
    `\t\t${ctx.optionQ}.WithBaseURL(baseURL),`,
    `\t\t${ctx.optionQ}.WithAPIKey("My API Key"),`,
    `\t)`,
  ].join('\n');
}

/** The standard mock-server preamble (baseURL + TEST_API_BASE_URL + skip probe). */
function mockPreamble(ctx: GoExampleCtx): string {
  ctx.imports.add('os');
  const testutilQ = ctx.imports.add(`${ctx.modulePath}/internal/testutil`);
  return [
    `\tbaseURL := "http://localhost:4010"`,
    `\tif envURL, ok := os.LookupEnv("TEST_API_BASE_URL"); ok {`,
    `\t\tbaseURL = envURL`,
    `\t}`,
    `\tif !${testutilQ}.CheckTestServer(t, baseURL) {`,
    `\t\treturn`,
    `\t}`,
  ].join('\n');
}

/** The call arguments: ctx, path args, then the params struct (if any). */
function callArgs(pathArgExprs: string[], params: ParamsExpr | null): { args: string[]; multiline: boolean } {
  const args = ['context.TODO()', ...pathArgExprs];
  let multiline = false;
  if (params) {
    args.push(params.text);
    multiline = params.multiline;
  }
  return { args, multiline };
}

/** A standard (mock-skipped) method test. */
function renderMainTest(
  funcName: string,
  segments: string[],
  methodName: string,
  pathArgExprs: string[],
  params: ParamsExpr | null,
  method: Method,
  op: OperationPlan,
  ctx: GoExampleCtx,
): string {
  const preamble = mockPreamble(ctx);
  const bind = methodHasResult(method, op) ? '_, err :=' : 'err :=';
  const { args, multiline } = callArgs(pathArgExprs, params);
  const call = callStatement(bind, clientChain(segments), methodName, args, multiline);
  return [
    `func ${funcName}(t *testing.T) {`,
    preamble,
    clientBlock(ctx),
    call,
    errorCheckBlock(ctx),
    `}`,
  ].join('\n');
}

/** A binary-response method test: httptest server returns "abc"; read + compare. */
function renderBinaryTest(
  funcName: string,
  segments: string[],
  methodName: string,
  pathArgExprs: string[],
  params: ParamsExpr | null,
  ctx: GoExampleCtx,
): string {
  ctx.imports.add('net/http');
  ctx.imports.add('net/http/httptest');
  ctx.imports.add('io');
  ctx.imports.add('bytes');
  const { args, multiline } = callArgs(pathArgExprs, params);
  const call = callStatement('resp, err :=', clientChain(segments), methodName, args, multiline);
  return [
    `func ${funcName}(t *testing.T) {`,
    `\tserver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {`,
    `\t\tw.WriteHeader(200)`,
    `\t\tw.Write([]byte("abc"))`,
    `\t}))`,
    `\tdefer server.Close()`,
    `\tbaseURL := server.URL`,
    clientBlock(ctx),
    call,
    errorCheckBlock(ctx),
    `\tdefer resp.Body.Close()`,
    ``,
    `\tb, err := io.ReadAll(resp.Body)`,
    errorCheckBlock(ctx),
    `\tif !bytes.Equal(b, []byte("abc")) {`,
    `\t\tt.Fatalf("return value not %s: %s", "abc", b)`,
    `\t}`,
    `}`,
  ].join('\n');
}

/** A guard test: the empty string for a required path param must be rejected. */
function renderPathGuardTest(
  baseFuncName: string,
  segments: string[],
  methodName: string,
  method: Method,
  op: OperationPlan,
  stringPathIdx: number,
  ctx: GoExampleCtx,
): string {
  ctx.imports.add('strings');
  const bind = methodHasResult(method, op) ? '_, err :=' : 'err :=';
  const pathArgs = (method.pathParams || []).map((p, i) =>
    i === stringPathIdx
      ? '""'
      : renderRefValue(p.type as TypeRef, planExample(p.type as TypeRef, ctx.types, { stringHint: p.name }), ctx),
  );
  const params = paramsStructExpr(segments, method, op, false, methodName, ctx);
  const { args, multiline } = callArgs(pathArgs, params);
  const call = callStatement(bind, clientChain(segments), methodName, args, multiline);
  return [
    `func ${baseFuncName}PathParams(t *testing.T) {`,
    `\tclient := ${ctx.pkgQ}.NewClient(`,
    `\t\t${ctx.optionQ}.WithBaseURL("http://localhost:4010"),`,
    `\t\t${ctx.optionQ}.WithAPIKey("My API Key"),`,
    `\t)`,
    call,
    `\tif err == nil || !strings.Contains(err.Error(), "missing required") {`,
    `\t\tt.Fatal("expected a missing required path param error")`,
    `\t}`,
    `}`,
  ].join('\n');
}

/** All test funcs for one method: the main test + an optional path-param guard. */
function renderMethodTests(segments: string[], method: Method, ctx: GoExampleCtx): string[] {
  const op = planOperation(method, ctx.types);
  const plan = planMethodExample(method, ctx.types);
  const withOptional = plan.hasOptional;
  const qualifier = resourceQualifier(segments);
  const methodName = goMethodName(method.action);
  const baseFuncName = `Test${qualifier}${methodName}`;
  const funcName = `${baseFuncName}${withOptional ? 'WithOptionalParams' : ''}`;

  const pathArgExprs = plan.pathArgs.map((pa) => renderRefValue(pa.param.type as TypeRef, pa.value, ctx));
  const params = paramsStructExpr(segments, method, op, withOptional, methodName, ctx);

  const out: string[] = [];
  if (op.binaryContentType) {
    out.push(renderBinaryTest(funcName, segments, methodName, pathArgExprs, params, ctx));
  } else {
    out.push(renderMainTest(funcName, segments, methodName, pathArgExprs, params, method, op, ctx));
  }

  const stringPathIdx = (method.pathParams || []).findIndex((p) => goType(p.type) === 'string');
  if (stringPathIdx >= 0) {
    out.push(renderPathGuardTest(baseFuncName, segments, methodName, method, op, stringPathIdx, ctx));
  }
  return out;
}

interface TestResource {
  name: string;
  methods?: Method[];
  resources?: TestResource[];
}

/** Walk a resource subtree, collecting method-test funcs into `decls`. */
function emitResourceTests(resource: TestResource, segments: string[], ctx: GoExampleCtx, decls: string[]): void {
  for (const method of resource.methods || []) {
    decls.push(...renderMethodTests(segments, method, ctx));
  }
  for (const sub of resource.resources || []) {
    emitResourceTests(sub, [...segments, sub.name], ctx, decls);
  }
}

/** The vendored test helper — faithful to openai-go internal/testutil, stdlib-only. */
const GO_TESTUTIL = `package testutil

import (
	"net/http"
	"os"
	"strconv"
	"testing"
)

func CheckTestServer(t *testing.T, url string) bool {
	if _, err := http.Get(url); err != nil {
		const SKIP_MOCK_TESTS = "SKIP_MOCK_TESTS"
		if str, ok := os.LookupEnv(SKIP_MOCK_TESTS); ok {
			skip, err := strconv.ParseBool(str)
			if err != nil {
				t.Fatalf("strconv.ParseBool(os.LookupEnv(%s)) failed: %s", SKIP_MOCK_TESTS, err)
			}
			if skip {
				t.Skip("The test will not run without a mock server running against your OpenAPI spec")
				return false
			}
			t.Errorf("The test will not run without a mock server running against your OpenAPI spec. You can set the environment variable %s to true to skip running any tests that require the mock server", SKIP_MOCK_TESTS)
			return false
		}
	}
	return true
}
`;

/**
 * A single per-operation USAGE SNIPPET (docs): a self-contained `package main`
 * that constructs the client and makes ONE required-only call — the same
 * call-assembly the test suite uses, minus the mock/assert/guard scaffolding.
 * `segments` is the resource-name chain the method hangs off (root→owner).
 */
export function generateGoUsage(method: Method, segments: string[], gctx: GoCtx): string {
  const imports = new Imports();
  imports.add('context');
  imports.add(gctx.modulePath); // the ROOT package — the client constructor
  const optionQ = imports.add(`${gctx.modulePath}/option`);
  const ctx: GoExampleCtx = { types: gctx.types, modulePath: gctx.modulePath, pkgQ: gctx.pkg, optionQ, imports };

  const op = planOperation(method, ctx.types);
  // A doc usage snippet: ALL fields with realistic (spec example/default) values.
  const plan = planMethodExample(method, ctx.types, { realistic: true, withOptional: true });
  const methodName = goMethodName(method.action);
  const pathArgExprs = plan.pathArgs.map((pa) => renderRefValue(pa.param.type as TypeRef, pa.value, ctx));
  const params = paramsStructExpr(segments, method, op, true, methodName, ctx, true);
  const { args, multiline } = callArgs(pathArgExprs, params);
  const hasResult = methodHasResult(method, op);
  const bind = hasResult ? 'result, err :=' : 'err :=';
  const call = callStatement(bind, clientChain(segments), methodName, args, multiline);

  if (hasResult) imports.add('fmt');
  // Client-construction options. When `baseUrlEnv` is set (only during a snippet-run
  // test) the client reads its base URL from that env var, so the snippet's request
  // can be captured; unset → default output (byte-identical to the docs snippet).
  const clientOpts = [`\t\t${ctx.optionQ}.WithAPIKey("My API Key"),`];
  if (gctx.baseUrlEnv) {
    const osQ = imports.add('os');
    clientOpts.push(`\t\t${ctx.optionQ}.WithBaseURL(${osQ}.Getenv(${JSON.stringify(gctx.baseUrlEnv)})),`);
  }
  const body = [
    `\tclient := ${ctx.pkgQ}.NewClient(`,
    ...clientOpts,
    `\t)`,
    call,
    `\tif err != nil {`,
    `\t\tpanic(err.Error())`,
    `\t}`,
    ...(hasResult ? [`\tfmt.Printf("%+v\\n", result)`] : []),
  ].join('\n');

  return goFile('main', imports, [`func main() {\n${body}\n}`]);
}

/**
 * The SDK's OWN test suite: one external `package <pkg>_test` file per top-level
 * resource (covering the whole subtree) plus the vendored internal/testutil.
 * Pure: IR in, GeneratedFile[] out.
 */
export function generateGoTests(spec: OpensdkSpecJson, gctx: GoCtx): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  for (const resource of (spec.resources as TestResource[]) || []) {
    const imports = new Imports();
    imports.add(gctx.modulePath); // the ROOT package under test
    const optionQ = imports.add(`${gctx.modulePath}/option`);
    imports.add('context');
    imports.add('testing');
    const ctx: GoExampleCtx = { types: gctx.types, modulePath: gctx.modulePath, pkgQ: gctx.pkg, optionQ, imports };

    const decls: string[] = [];
    emitResourceTests(resource, [resource.name], ctx, decls);
    if (decls.length === 0) continue;

    files.push({
      path: `${slug(resource.name) || 'service'}_test.go`,
      content: goFile(`${gctx.pkg}_test`, imports, decls),
    });
  }
  if (files.length === 0) return [];
  // Vendored once, alongside the runtime's other internal/ packages.
  files.unshift({ path: 'internal/testutil/testutil.go', content: GO_TESTUTIL });
  return files;
}
