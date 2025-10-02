import { Handler, Options } from "./handler";

export async function handler(config: Request | Options) {
  if (config instanceof Request) {
    const handlerFn = await Handler.New({
      ...Handler.defaultConfig(),
    });
    return handlerFn(config);
  }

  return Handler.New(config as Options);
}

