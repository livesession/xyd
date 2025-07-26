export interface OpenAPISamplerOptions {
  skipReadOnly?: boolean;
  maxSampleDepth?: number;
  format?: string;
  quiet?: boolean;
}

export interface OpenAPISamplerSpec {
  [key: string]: any;
}

export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  example?: any;
  examples?: Record<string, any>;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  $ref?: string;
  [key: string]: any;
}

export function sample(schema: JSONSchema, options?: OpenAPISamplerOptions, spec?: OpenAPISamplerSpec): any;

export function _registerSampler(type: string, sampler: Function): void;

export const _samplers: Record<string, Function>;

export function inferType(schema: JSONSchema): string;

export default {
  sample,
  _registerSampler,
  _samplers,
  inferType
}; 