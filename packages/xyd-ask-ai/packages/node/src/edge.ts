import { Handler, Options } from "./handler";

export function handler(config: Request): Promise<Response>;
export function handler(config: Options): (request: Request) => Promise<Response>;
export function handler(config: Request | Options) {
  if (config instanceof Request) {
    const handlerFn = Handler.New({
      ...Handler.defaultConfig(),
    });
    return handlerFn(config);
  }

  return Handler.New(config as Options);
}

