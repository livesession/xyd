import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { snakeCase } from './naming';
import { rbString } from './rbwriter';

/**
 * Emit `<pkg>.gemspec`: a dependency-free gem manifest (stdlib-only SDK, so no
 * `add_dependency`). Marked user-owned scaffold by the emitter so regen never
 * clobbers a hand-edited gemspec. Gets NO ownership header (`.gemspec` is an
 * extension the orchestrator leaves untouched), so `frozen_string_literal`
 * stays a valid line-1 magic comment.
 */
export function renderGemspec(spec: OpensdkSpecJson, pkg: string): string {
  const info = spec.info;
  const summary = `Ruby client for the ${info.title} API`;
  const description = info.description?.trim() || summary;
  // Publish identity from spec.info (OpenAPI `info` or an sdk.json `publish`
  // override), falling back to the historical opensdk/MIT defaults.
  const author = info.contact?.name || 'opensdk';
  const license = info.license?.identifier || 'MIT';
  const lines = [
    '# frozen_string_literal: true',
    '',
    'Gem::Specification.new do |spec|',
    `  spec.name = ${rbString(pkg)}`,
    `  spec.version = ${rbString(info.version || '0.0.0')}`,
    `  spec.summary = ${rbString(summary)}`,
    `  spec.description = ${rbString(description)}`,
    `  spec.authors = [${rbString(author)}]`,
    `  spec.license = ${rbString(license)}`,
  ];
  if (info.homepage) lines.push(`  spec.homepage = ${rbString(info.homepage)}`);
  if (info.repository) lines.push(`  spec.metadata = { "source_code_uri" => ${rbString(info.repository)} }`);
  lines.push(
    '  spec.required_ruby_version = ">= 2.6.0"',
    '  spec.files = Dir["lib/**/*.rb", "*.gemspec"]',
    '  spec.require_paths = ["lib"]',
    'end',
  );
  return `${lines.join('\n')}\n`;
}

/**
 * Emit `lib/<pkg>.rb`: the gem entry point. Requires the stdlib transports the
 * runtime needs, then the generated files in dependency order (transport ->
 * models -> resources -> client). Fully generated (overwrite): the require list
 * tracks the emitted file set.
 */
export function renderEntrypoint(spec: OpensdkSpecJson, pkg: string): string {
  const requires = [
    'require "json"',
    'require "net/http"',
    'require "securerandom"',
    'require "time"',
    'require "uri"',
    '',
    `require_relative ${rbString(`${pkg}/transport`)}`,
    `require_relative ${rbString(`${pkg}/models`)}`,
  ];
  for (const r of spec.resources || []) {
    requires.push(`require_relative ${rbString(`${pkg}/resources/${snakeCase(r.name)}`)}`);
  }
  requires.push(`require_relative ${rbString(`${pkg}/client`)}`);
  return `${requires.join('\n')}\n`;
}
