import { type Server, createServer } from 'node:http';

import { type Method, type NamedType, type OpensdkSpecJson, type TypeRef, walkMethods } from '@xyd-js/opensdk-core';
import { type ExampleValue, planExample } from '@xyd-js/opensdk-framework';

// A spec-shaped mock API server built from the IR — the in-repo analog of Prism
// mocking an OpenAPI doc. For each incoming request it matches a method by
// (httpMethod, path template) and replies 200 with a JSON example of that
// method's response (via the shared example planner), so a generated SDK's OWN
// test suite (the <resource>_test.go / test_<resource>.py it ships) runs GREEN
// against it — proving the emitted tests actually execute and pass, not just
// compile. Binary-download methods are exercised by the SDK's own httptest
// server, so they never reach this mock.

interface Route {
  httpMethod: string;
  regex: RegExp;
  body: string;
}

/** `/pets/{pet_id}/toys` -> `^/pets/[^/]+/toys/?(\?.*)?$` (path params match one segment). */
function pathTemplateToRegex(template: string): RegExp {
  const escaped = template
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex metachars in the literal parts
    .replace(/\\\{[^}]+\\\}/g, '[^/]+'); // {param} (now escaped as \{param\}) -> one segment
  return new RegExp(`^${escaped}/?(\\?.*)?$`);
}

/** Turn a language-neutral ExampleValue into a plain JS value for JSON serialization. */
function exampleJson(value: ExampleValue): unknown {
  switch (value.kind) {
    case 'string':
      return value.value;
    case 'integer':
    case 'number':
      return value.value;
    case 'boolean':
      return value.value;
    case 'null':
      return null;
    case 'binary':
      return '';
    case 'enum':
      return value.value;
    case 'const':
      return value.value;
    case 'array':
      return [exampleJson(value.item)];
    case 'map':
      return { key: exampleJson(value.value) };
    case 'object': {
      const obj: Record<string, unknown> = {};
      for (const f of value.fields) obj[f.name] = exampleJson(f.value);
      return obj;
    }
    case 'union':
      return exampleJson(value.variant);
    default:
      // 'any' (incl. anything the planner bottomed out at its depth cap): serve
      // null, which decodes into ANY typed field (int64, struct, slice, ...)
      // without error — an object `{}` would fail to unmarshal into a scalar.
      return null;
  }
}

/** The 200 body a correct SDK can decode for `method`: a page envelope or a response example. */
function responseBody(method: Method, types: Map<string, NamedType>): string {
  if (method.pagination) {
    const itemType = method.pagination.itemType as TypeRef | undefined;
    const item = itemType ? exampleJson(planExample(itemType, types)) : {};
    const env: Record<string, unknown> = { [method.pagination.itemsField || 'data']: [item] };
    if (method.pagination.nextField) env[method.pagination.nextField] = false;
    return JSON.stringify(env);
  }
  const primary = method.primaryResponse as TypeRef | undefined;
  if (!primary) return '{}';
  return JSON.stringify(exampleJson(planExample(primary, types)));
}

/** A mock server that answers every method in `spec` with a decodable example response. */
export class MockServer {
  private server: Server;
  private routes: Route[];
  port = 0;

  constructor(spec: OpensdkSpecJson) {
    const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
    this.routes = walkMethods(spec).map(({ method }) => ({
      httpMethod: String(method.httpMethod || 'get').toLowerCase(),
      regex: pathTemplateToRegex(method.path || '/'),
      body: responseBody(method, types),
    }));
    // longest template first so `/pets/{id}/toys` wins over a `/pets/{id}` prefix
    this.routes.sort((a, b) => b.regex.source.length - a.regex.source.length);

    this.server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => {
        body += c;
      });
      req.on('end', () => {
        const m = String(req.method || 'get').toLowerCase();
        const url = req.url || '/';
        const route = this.routes.find((r) => r.httpMethod === m && r.regex.test(url));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(route ? route.body : '{}');
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) =>
      this.server.listen(0, '127.0.0.1', () => {
        this.port = (this.server.address() as { port: number }).port;
        resolve();
      }),
    );
  }

  stop() {
    this.server.close();
  }
}
