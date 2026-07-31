import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { pascalCase, snakeCase } from './naming';
import { braced, rsDoc, rsString } from './rswriter';

/**
 * Emit `src/client.rs`: the top-level `Client` with an accessor per top-level
 * resource, a `from_env` constructor seeding the credential from the
 * environment, and a `ClientBuilder` for base URL / timeout overrides. The
 * client owns the single shared `Arc<Transport>`.
 */
export function renderClientFile(spec: OpensdkSpecJson, envVar: string): string {
  const resources = spec.resources || [];

  const accessors = resources
    .map((r) => {
      const mod = snakeCase(r.name);
      const cls = pascalCase(r.name);
      return braced(
        `pub fn ${snakeCase(r.name)}(&self) -> crate::${mod}::${cls}`,
        `crate::${mod}::${cls}::new(self.transport.clone())`,
      );
    })
    .join('\n\n');

  const clientImplBody = [
    braced(
      'pub fn new(api_key: impl Into<String>) -> Self',
      'Client {\n    transport: Arc::new(Transport::new(Some(api_key.into()), None, None)),\n}',
    ),
    braced(
      `pub fn from_env() -> Self`,
      `Client {\n    transport: Arc::new(Transport::new(std::env::var(${rsString(envVar)}).ok(), None, None)),\n}`,
    ),
    braced('pub fn builder() -> ClientBuilder', 'ClientBuilder::default()'),
    accessors,
  ]
    .filter(Boolean)
    .join('\n\n');

  const builderImplBody = [
    braced('pub fn api_key(mut self, api_key: impl Into<String>) -> Self', 'self.api_key = Some(api_key.into());\nself'),
    braced('pub fn base_url(mut self, base_url: impl Into<String>) -> Self', 'self.base_url = Some(base_url.into());\nself'),
    braced('pub fn timeout_ms(mut self, timeout_ms: u64) -> Self', 'self.timeout_ms = Some(timeout_ms);\nself'),
    braced(
      'pub fn build(self) -> Client',
      'Client {\n    transport: Arc::new(Transport::new(self.api_key, self.base_url, self.timeout_ms)),\n}',
    ),
  ].join('\n\n');

  const doc = rsDoc(`Client is the ${spec.info.title} API client.`);
  return `use std::sync::Arc;

use crate::transport::Transport;

${doc}
pub struct Client {
    transport: Arc<Transport>,
}

${braced('impl Client', clientImplBody)}

/// A builder for base URL / timeout overrides.
#[derive(Default)]
pub struct ClientBuilder {
    api_key: Option<String>,
    base_url: Option<String>,
    timeout_ms: Option<u64>,
}

${braced('impl ClientBuilder', builderImplBody)}
`;
}
