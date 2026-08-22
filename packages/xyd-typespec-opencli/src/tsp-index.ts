import {
  $aka,
  $argument,
  $cli,
  $command,
  $example,
  $globalOptions,
  $option,
} from "./decorators.js";

export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  XydCli: {
    cli: $cli,
    command: $command,
    argument: $argument,
    option: $option,
    globalOptions: $globalOptions,
    aka: $aka,
    example: $example,
  },
};
