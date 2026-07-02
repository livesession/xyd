import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { javaDoc, javaFile } from './javawriter';
import { camelCase, serviceTypeName } from './naming';
import type { JavaCtx } from './project';

/**
 * Emit `Client.java`: the top-level client with a field + accessor per
 * top-level resource service, an `apiKey`/`baseUrl` constructor, an
 * openai-java-style `builder()`, and a `fromEnv()` convenience that seeds the
 * credential from the spec's auth env var.
 */
export function renderClientFile(spec: OpensdkSpecJson, ctx: JavaCtx): string {
  const resources = spec.resources || [];

  const fieldLines = ['  private final Transport transport;'];
  for (const r of resources) fieldLines.push(`  private final ${serviceTypeName([r.name])} ${camelCase(r.name)};`);

  const ctorLines = [
    '    this.transport = new Transport(baseUrl, apiKey);',
    ...resources.map((r) => `    this.${camelCase(r.name)} = new ${serviceTypeName([r.name])}(transport);`),
  ];
  const ctor = `  public Client(String apiKey, String baseUrl) {\n${ctorLines.join('\n')}\n  }`;

  const accessors = resources
    .map((r) => `  public ${serviceTypeName([r.name])} ${camelCase(r.name)}() {\n    return ${camelCase(r.name)};\n  }`)
    .join('\n\n');

  const defaultBaseUrl = JSON.stringify(ctx.baseURL);
  const keyExpr = ctx.envVar
    ? `apiKey != null ? apiKey : System.getenv(${JSON.stringify(ctx.envVar)})`
    : 'apiKey';
  const fromEnvDoc = ctx.envVar
    ? javaDoc(`Create a client seeded with the credential from ${ctx.envVar}.`, '  ')
    : javaDoc('Create a client using the default configuration.', '  ');

  const builder =
    `  public static final class Builder {\n` +
    `    private String apiKey;\n` +
    `    private String baseUrl = ${defaultBaseUrl};\n\n` +
    `    public Builder apiKey(String apiKey) {\n      this.apiKey = apiKey;\n      return this;\n    }\n\n` +
    `    public Builder baseUrl(String baseUrl) {\n      this.baseUrl = baseUrl;\n      return this;\n    }\n\n` +
    `    public Client build() {\n` +
    `      String key = ${keyExpr};\n` +
    `      return new Client(key, baseUrl);\n    }\n  }`;

  const doc = javaDoc(`Client is the ${spec.info.title} API client.`);
  const head = doc ? `${doc}\n` : '';
  const members = [
    fieldLines.join('\n'),
    ctor,
    accessors,
    '  public static Builder builder() {\n    return new Builder();\n  }',
    `${fromEnvDoc}\n  public static Client fromEnv() {\n    return builder().build();\n  }`,
    builder,
  ]
    .filter(Boolean)
    .join('\n\n');
  const body = `${head}public final class Client {\n${members}\n}`;
  return javaFile(ctx.fullPackage, [], body);
}
