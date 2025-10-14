/**
 * Recursively replaces environment variable placeholders in an object
 * @param obj - The object to process
 * @returns The object with environment variables replaced
 */
export function replaceEnvVars<T>(obj: T, removeUndefined: boolean = false): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Check if the string contains environment variable placeholders
    if (obj.includes("$")) {
      return obj.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
        const envValue = process.env[varName];
        if (envValue === undefined) {
          if (removeUndefined) {
            return ""
          }
          console.warn(
            `\n⚠️ Environment variable "${varName}" is not set, keeping placeholder: ${match}`
          );
          return match;
        }
        return envValue;
      }) as T;
    }

    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceEnvVars(item, removeUndefined)) as T;
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvVars(value, removeUndefined);
    }
    return result;
  }

  return obj
}
