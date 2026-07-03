import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { snakeCase } from './naming';
import { block, indent, rbComment, rbString } from './rbwriter';
import { resourceClassName, type RubyCtx } from './service';

/**
 * Emit `lib/<pkg>/client.rb`: the top-level `Client` with a reader per
 * top-level resource and an `initialize(api_key:, base_url:, timeout:)` that
 * seeds the credential from the environment (openai-ruby's `OpenAI::Client`
 * shape, minus Sorbet). The client owns the single shared `Transport`.
 */
export function renderClientFile(spec: OpensdkSpecJson, ctx: RubyCtx, envVar: string): string {
  const resources = spec.resources || [];
  const members: string[] = [];

  if (resources.length > 0) {
    members.push(`attr_reader ${resources.map((r) => `:${snakeCase(r.name)}`).join(', ')}`);
  }

  const ctorLines = [
    `def initialize(api_key: nil, base_url: nil, timeout: nil)`,
    indent(`api_key = ENV[${rbString(envVar)}] if api_key.nil?`),
    indent(`@transport = ${ctx.moduleName}::Transport.new(api_key: api_key, base_url: base_url, timeout: timeout)`),
  ];
  for (const r of resources) {
    ctorLines.push(indent(`@${snakeCase(r.name)} = ${ctx.moduleName}::Resources::${resourceClassName([r.name])}.new(@transport)`));
  }
  ctorLines.push('end');
  members.push(ctorLines.join('\n'));

  const doc = rbComment(`Client is the ${spec.info.title} API client.`);
  const clientClass = `${doc}\n${block('class Client', members.join('\n\n'))}`;
  return `${block(`module ${ctx.moduleName}`, clientClass)}\n`;
}
