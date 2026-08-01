import type { Plugin } from "vite";
export interface ApiatlasWidgetProxyOptions {
  /** Mount base for the proxy (must match the widget's proxyBaseUrl). Default /apiatlas-api. */
  basePath?: string;
}
export function apiatlasWidgetProxy(options?: ApiatlasWidgetProxyOptions): Plugin;
export function handleHttpProxy(req: unknown, res: unknown): Promise<void>;
declare const _default: typeof apiatlasWidgetProxy;
export default _default;
