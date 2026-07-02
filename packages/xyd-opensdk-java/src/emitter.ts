import type { NamedType, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';
import type { Emitter, EmitterContext, GeneratedFile } from '@xyd-js/opensdk-framework';
import { generate } from '@xyd-js/opensdk-framework';

import { renderClientFile } from './client';
import { generateJavaTests } from './example-java';
import { HEADER } from './javawriter';
import { renderTypeFiles } from './model';
import { pomXml, resolveJavaOptions } from './project';
import { runtimeFiles } from './runtime';
import { renderResourceFiles } from './service';
import type { OpensdkJavaOptions } from './types';

/**
 * The Java emitter plugin: a buildable, openai-java-shaped SDK
 * (`client.pets().list(params)`, `Params.builder()`, path-qualified services,
 * typed model POJOs, Java enums) over a dependency-free stdlib runtime
 * (java.net.http + a hand-rolled Json codec). Pure capability methods over the
 * IR — the framework orchestrator assembles the file map.
 *
 * Note: the framework's ownership-header machinery only knows the comment
 * syntax for .go/.py/.ts/... — NOT .java — so `fileHeader` here is declared for
 * contract-consistency but the `// Code generated ...` marker is applied by the
 * emitter's own `javaFile()` writer (belt-and-suspenders: if .java were ever
 * added to the map, the orchestrator's idempotent prefix check leaves it be).
 */
export const javaEmitter: Emitter = {
  language: 'java',

  fileHeader(): string {
    return HEADER;
  },

  generateProject(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const jctx = resolveJavaOptions(spec, ctx);
    // User-owned scaffold: never clobber an existing pom.xml on regen.
    return [{ path: 'pom.xml', content: pomXml(jctx, spec.info.version), writeMode: 'skipIfExists' }];
  },

  generateClient(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const jctx = resolveJavaOptions(spec, ctx);
    return [{ path: `${jctx.srcDir}Client.java`, content: renderClientFile(spec, jctx) }];
  },

  generateTypes(types: NamedType[], ctx: EmitterContext): GeneratedFile[] {
    const jctx = resolveJavaOptions(ctx.spec, ctx);
    return renderTypeFiles(types, jctx);
  },

  generateResources(resources: Resource[], ctx: EmitterContext): GeneratedFile[] {
    const jctx = resolveJavaOptions(ctx.spec, ctx);
    return renderResourceFiles(resources, jctx);
  },

  generateRuntime(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const jctx = resolveJavaOptions(spec, ctx);
    return runtimeFiles(spec, jctx);
  },

  // The SDK's OWN dependency-free assertion test suite (one class per top-level
  // resource, runnable with plain `java`). Default ON; opt out with
  // emitterOptions.tests === false (same gate as the Go/Python emitters).
  generateTests(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    if ((ctx.emitterOptions as OpensdkJavaOptions).tests === false) return [];
    const jctx = resolveJavaOptions(spec, ctx);
    return generateJavaTests(spec, jctx);
  },
};

/**
 * Generate a buildable, openai-java-shaped Java SDK from an OpenSDK IR.
 * Back-compat wrapper: drives the `javaEmitter` plugin through the framework
 * orchestrator. Pure: returns a virtual file map `{ relativePath: contents }`.
 */
export function opensdkJava(spec: OpensdkSpecJson, options: OpensdkJavaOptions = {}): Record<string, string> {
  return generate(spec, javaEmitter, options as Record<string, unknown>);
}
