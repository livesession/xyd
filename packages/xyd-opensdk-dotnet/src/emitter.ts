import { type NamedType, type OpensdkSpecJson, type Resource, type SdkSecurity, sdkBehavior, walkMethods } from '@xyd-js/opensdk-core';
import type { Emitter, EmitterContext, GeneratedFile } from '@xyd-js/opensdk-framework';
import { planOperation } from '@xyd-js/opensdk-framework';

import { renderClientFile } from './client';
import { CSPROJ_HEADER } from './cswriter';
import { renderModelsFile } from './model';
import { dotnetPageName, renderPaginationFile } from './pagination';
import { pascalCase } from './naming';
import { renderTransportFile } from './runtime';
import { renderServiceFile } from './service';
import { renderTestFiles } from './tests-cs';
import type { OpensdkDotnetOptions } from './types';

interface ResolvedDotnetOptions {
  sdk: string;
  namespace: string;
  baseURL: string;
  targetFramework: string;
  envVar?: string;
}

function resolveOptions(spec: OpensdkSpecJson, ctx: EmitterContext): ResolvedDotnetOptions {
  const options = ctx.emitterOptions as OpensdkDotnetOptions;
  const sdk = options.sdkName ?? (pascalCase(spec.info.title) || 'Client');
  return {
    sdk,
    namespace: options.namespace ?? `Example.${sdk}`,
    baseURL: options.baseURL ?? spec.servers?.[0] ?? '',
    targetFramework: options.targetFramework ?? 'net8.0',
    envVar: spec.security?.find((s) => s.envVar)?.envVar,
  };
}

/** The `.csproj` — net8.0, nullable enabled, NO external PackageReferences. */
function csprojFile(sdk: string, namespaceName: string, targetFramework: string): string {
  return `${CSPROJ_HEADER}
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <RootNamespace>${namespaceName}</RootNamespace>
    <AssemblyName>${sdk}</AssemblyName>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
  </PropertyGroup>

</Project>
`;
}

/**
 * The C# / .NET emitter plugin: an openai-dotnet-shaped, dependency-free SDK
 * (System.Net.Http + System.Text.Json only). Pure capability methods over the
 * IR — the framework orchestrator assembles the file map.
 *
 * Note: `.cs`/`.csproj` are not extensions the orchestrator knows a comment
 * syntax for, so this emitter deliberately does NOT implement `fileHeader`;
 * the machine-ownership marker is baked into each file by the cs/csproj writers.
 */
export const dotnetEmitter: Emitter = {
  language: 'dotnet',

  generateProject(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const { sdk, namespace, targetFramework } = resolveOptions(spec, ctx);
    return [{ path: `${sdk}.csproj`, content: csprojFile(sdk, namespace, targetFramework) }];
  },

  generateClient(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const { sdk, namespace, baseURL, envVar } = resolveOptions(spec, ctx);
    return [{ path: 'Client.cs', content: renderClientFile(spec, { sdk, namespace, baseURL, envVar }) }];
  },

  // Models.cs is emitted even for an empty symbol table so the module always exists.
  generateTypes(types: NamedType[], ctx: EmitterContext): GeneratedFile[] {
    const { namespace } = resolveOptions(ctx.spec, ctx);
    return [{ path: 'Models.cs', content: renderModelsFile(types, namespace) }];
  },

  generateResources(resources: Resource[], ctx: EmitterContext): GeneratedFile[] {
    const { namespace } = resolveOptions(ctx.spec, ctx);
    const serviceCtx = { namespace, types: ctx.types as Map<string, NamedType>, behavior: sdkBehavior(ctx.spec) };
    return resources.map((resource) => {
      const file = renderServiceFile(resource, serviceCtx);
      return { path: file.path, content: file.content };
    });
  },

  generateRuntime(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    const { sdk, namespace, baseURL } = resolveOptions(spec, ctx);
    const security = (spec.security ?? []) as SdkSecurity[];
    const files: GeneratedFile[] = [
      { path: 'Transport.cs', content: renderTransportFile(spec, { sdk, namespace, baseURL, security }) },
    ];
    // Pagination.cs only when some method returns a page (no dead runtime code).
    if (walkMethods(spec).some(({ method }) => dotnetPageName(planOperation(method, ctx.types)) !== null)) {
      files.push({ path: 'Pagination.cs', content: renderPaginationFile(namespace) });
    }
    return files;
  },

  // The SDK's own test suite (openai-dotnet's tests). Off via emitterOptions.tests
  // === false; default ON. One <Resource>Tests.cs per top-level resource plus the
  // vendored, dependency-free [Fact] framework + mock-server probe.
  generateTests(spec: OpensdkSpecJson, ctx: EmitterContext): GeneratedFile[] {
    if ((ctx.emitterOptions as OpensdkDotnetOptions).tests === false) return [];
    const { sdk, namespace, targetFramework } = resolveOptions(spec, ctx);
    const resources = spec.resources || [];
    if (resources.length === 0) return [];
    return renderTestFiles(resources, { sdk, namespace, targetFramework, types: ctx.types as Map<string, NamedType> });
  },
};
