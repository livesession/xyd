export interface OpensdkPythonOptions {
  /** The Python package name. Default: derived from `info.title` (snake_case). */
  packageName?: string;
  /** Default API base URL. Default: the first `servers` entry. */
  baseURL?: string;
}
