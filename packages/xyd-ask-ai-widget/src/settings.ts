/**
 * The settings for the Ask AI widget
 */
export interface Settings {
  /**
   * The AI settings to use
   */
  ai: AI;

  /**
   * The MCP settings to use
   */
  mcp?: MCP;

  /**
   * The sources to use
   */
  sources?: Sources;

  /**
   * The headers to use
   * @example { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With", "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE", "Access-Control-Max-Age": "86400" }
   */
  headers?: Record<string, string>;
}

export interface AI {
  /**
   * The AI provider to use
   * @example "openai"
   * @example "anthropic"
   */
  provider: string;

  /**
   * The AI model to use
   * @example "gpt-4o"
   * @example "claude-3-5-sonnet-20240620"
   */
  model: string;

  /**
   * The AI token to use
   * @example "sk-1234567890"
   */
  token: string;
}

export interface MCP {
  /**
   * The MCP URL to use
   * @example "http://localhost:3000/mcp"
   * @example ["http://localhost:3000/mcp", "http://localhost:3001/mcp"]
   */
  url: string | string[];
}

export interface Sources {
  /**
   * The OpenAPI sources to use
   * @example "http://localhost:3000/openapi.yaml"
   * @example ["http://localhost:3000/openapi.yaml", "./openapi.yaml"]
   */
  openapi: string | string[];

  /**
   * The LLMs sources to use
   * @example "http://localhost:3000/llms.tx"
   * @example ["http://localhost:3000/llms.txt", "./llms.txt"]
   */
  llms: string | string[];
}
