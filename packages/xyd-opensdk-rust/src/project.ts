import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { snakeCase } from './naming';
import { rsString } from './rswriter';

/**
 * Emit `Cargo.toml`: a fixed-dependency manifest (async reqwest + tokio + serde),
 * so regen never has to mutate a user-owned file — the emitter marks it
 * `skipIfExists`. Gets NO ownership header (`.toml` is left untouched by the
 * orchestrator).
 */
export function renderCargoToml(spec: OpensdkSpecJson, crate: string, edition: string): string {
  const info = spec.info;
  const summary = `Rust client for the ${info.title} API`;
  const description = info.description?.trim() || summary;
  const license = info.license?.identifier || 'MIT';

  const pkg = [
    '[package]',
    `name = ${rsString(crate)}`,
    `version = ${rsString(info.version || '0.0.0')}`,
    `edition = ${rsString(edition)}`,
    `description = ${rsString(description)}`,
    `license = ${rsString(license)}`,
  ];
  if (info.homepage) pkg.push(`homepage = ${rsString(info.homepage)}`);
  if (info.repository) pkg.push(`repository = ${rsString(info.repository)}`);

  return `${pkg.join('\n')}

# Field docs are OpenAPI descriptions (arbitrary markdown), not Rust doctests.
[lib]
doctest = false

[dependencies]
reqwest = { version = "0.12", default-features = false, features = ["json", "multipart", "rustls-tls"] }
tokio = { version = "1", features = ["time"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
uuid = { version = "1", features = ["v4"] }

[dev-dependencies]
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
`;
}

/**
 * Emit `src/lib.rs`: the module list + ergonomic `pub use` re-exports (Client,
 * Error, Page, models, and each resource). Fully generated (overwrite): the
 * module list tracks the emitted file set. A crate-level `allow` keeps the
 * generated code warning-clean under stricter lint settings.
 */
export function renderLibRs(spec: OpensdkSpecJson): string {
  const resourceMods = (spec.resources || []).map((r) => snakeCase(r.name));

  const mods = ['error', 'transport', 'models', 'client', ...resourceMods].map((m) => `pub mod ${m};`);

  const reexports = [
    'pub use client::{Client, ClientBuilder};',
    'pub use error::{Error, ErrorKind};',
    'pub use models::*;',
    'pub use transport::Page;',
    ...resourceMods.map((m) => `pub use ${m}::*;`),
  ];

  return `#![allow(dead_code, unused_imports, unused_variables, unused_mut, clippy::all)]

${mods.join('\n')}

${reexports.join('\n')}
`;
}
