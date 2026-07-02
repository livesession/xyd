import { type NamedType, type OpensdkSpecJson, type ResolvedSdkBehavior, sdkBehavior } from '@xyd-js/opensdk-core';
import type { EmitterContext } from '@xyd-js/opensdk-framework';

import { javaPackageName } from './naming';
import type { OpensdkJavaOptions } from './types';

/** Per-file emit context: package layout, symbol table, auth, resolved behavior. */
export interface JavaCtx {
  /** The leaf package segment, e.g. "petstore". */
  pkg: string;
  /** The base package prefix, e.g. "com.example". */
  basePackage: string;
  /** The full package, e.g. "com.example.petstore". */
  fullPackage: string;
  /** The source directory prefix every .java file nests under (Maven layout). */
  srcDir: string;
  types: Map<string, NamedType>;
  behavior: ResolvedSdkBehavior;
  baseURL: string;
  /** The env var the client seeds its credential from, or null when unauthenticated. */
  envVar: string | null;
  /** The normalized auth scheme kind (bearer | apiKey-header | apiKey-query | ...), or null. */
  authKind: string | null;
  /** The header/query name for apiKey auth, or null. */
  authName: string | null;
  /** The SDK identifier baked into the User-Agent, e.g. "petstore-java/1.2.0". */
  userAgent: string;
}

export function resolveJavaOptions(spec: OpensdkSpecJson, ctx: EmitterContext): JavaCtx {
  const options = ctx.emitterOptions as OpensdkJavaOptions;
  const pkg = options.packageName ?? javaPackageName(spec.info.title);
  const basePackage = options.basePackage ?? 'com.example';
  const fullPackage = `${basePackage}.${pkg}`;
  const security = spec.security?.[0];
  const behavior = sdkBehavior(spec);
  const userAgent = behavior.userAgent.sdkIdentifierTemplate
    .split('{package}')
    .join(pkg)
    .split('{language}')
    .join('java')
    .split('{version}')
    .join(spec.info.version || '0.0.0');
  return {
    pkg,
    basePackage,
    fullPackage,
    srcDir: `src/main/java/${fullPackage.split('.').join('/')}/`,
    types: ctx.types as Map<string, NamedType>,
    behavior,
    baseURL: options.baseURL ?? spec.servers?.[0] ?? '',
    envVar: spec.security?.find((s) => s.envVar)?.envVar ?? null,
    authKind: security?.kind ?? null,
    authName: security?.name ?? null,
    userAgent,
  };
}

/**
 * `pom.xml` — the build manifest. Dependency-free (the runtime is stdlib-only),
 * so it declares only the compiler release. User-owned scaffold: never clobber
 * an existing pom on regen (mirrors the Go/Python go.mod/pyproject writeMode).
 * The generated source tree is equally compilable by a bare
 * `javac $(find . -name '*.java')`.
 */
export function pomXml(ctx: JavaCtx, version: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>${ctx.basePackage}</groupId>
  <artifactId>${ctx.pkg}-java</artifactId>
  <version>${version || '0.0.0'}</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.release>11</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
</project>
`;
}
