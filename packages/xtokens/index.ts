// TODO: type-safe + intellisense

type TokenReference<T> = {
    [K in keyof T]: T[K] extends Record<string, any>
        ? TokenReference<T[K]>
        : string;
};

type ReferenceTokens = {
    palette: {
        [key: string]: string;
    };
};

type SystemTokens = {
    color: {
        [key: string]: string;
    };
};

type ComponentTokens = {
    [key: string]: string | Record<string, any>;
};

class Tokens {
    private references: ReferenceTokens = {palette: {}};
    private systems: SystemTokens = {color: {}};
    private componentTokens: ComponentTokens = {};

    constructor(private prefix: string) {
    }

    public ref(values: ReferenceTokens): TokenReference<ReferenceTokens> {
        Object.assign(this.references, values);
        return this.createTokenReference(values);
    }

    public sys(values: SystemTokens): TokenReference<SystemTokens> {
        Object.entries(values.color || {}).forEach(([key, value]) => {
            if (!this.isRawValue(value) && !this.resolveReference(value)) {
                throw new Error(`Invalid reference token: ${value}`);
            }
        });
        Object.assign(this.systems, values);
        return this.createTokenReference(values);
    }

    public comp(values: ComponentTokens): void {
        const flatValues = this.flatten(values);
        Object.entries(flatValues).forEach(([key, value]) => {
            if (!this.isRawValue(value) && !this.resolveReference(value)) {
                throw new Error(`Invalid system or reference token: ${value}`);
            }
        });
        Object.assign(this.componentTokens, flatValues);
    }

    public generateCSS(): string {
        const toCSS = (prefix: string, obj: Record<string, any>): string =>
            Object.entries(obj)
                .map(([key, value]) => {
                    const cssKey = this.transformKeyToCSS(key);
                    const cssValue =
                        typeof value === "string"
                            ? this.isRawValue(value)
                                ? value
                                : `var(--${this.prefix}-${this.transformValueToCSS(value)})`
                            : null;
                    return cssValue
                        ? `--${this.prefix}-${prefix}-${cssKey}: ${cssValue};`
                        : null;
                })
                .filter(Boolean)
                .join("\n");

        return `
      /* reference */
      :root {
        ${toCSS("ref-palette", this.references.palette)}
      }
      /* system */
      :root {
        ${toCSS("sys-color", this.systems.color)}
      }
      /* components */
      :root {
        ${toCSS("comp", this.componentTokens)}
      }
    `;
    }


    private createTokenReference<T>(tokens: T): TokenReference<T> {
        return tokens as TokenReference<T>;
    }

    private flatten(
        obj: Record<string, any>,
        parentKey = "",
        result: Record<string, string> = {}
    ): Record<string, string> {
        for (const [key, value] of Object.entries(obj)) {
            const flatKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof value === "object" && !Array.isArray(value)) {
                this.flatten(value, flatKey, result);
            } else {
                result[flatKey] = value;
            }
        }
        return result;
    }

    private resolveReference(name: string): boolean {
        const parts = name.split(".");
        if (parts.length < 3) return false;

        const [scope, category, ...rest] = parts;
        const tokenKey = rest.join(".");
        if (scope === "ref" && this.references[category]?.[tokenKey]) return true;
        if (scope === "sys" && this.systems[category]?.[tokenKey]) return true;

        return false;
    }

    private isRawValue(value: string): boolean {
        return /^#/.test(value);
    }

    private transformKeyToCSS(key: string): string {
        return key
            .split(".")
            .map((k: string) => {
                if (k.includes("--")) {
                    return k;
                }
                return k.replaceAll("-", "__").replaceAll(".", "-");
            })
            .join("-");

        if (key.startsWith("--")) return key;
        return key.replace(/\./g, "-").replace(/_(?!_)/g, "-");
    }

    private transformValueToCSS(value: string): string {
        return value.replace(/\./g, "-");
    }

}

export function xtokens(prefix: string) {
    return new Tokens(prefix);
}
