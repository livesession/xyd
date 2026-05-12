import type { TranslationCatalog } from "../types/settings";

const I18N_REF = /^i18n:\s*(.+)$/;

/**
 * Resolve a single value against per-locale translation catalogs.
 *
 * - Plain strings without the `i18n:` prefix pass through unchanged.
 * - Strings matching `^i18n:\s*(.+)$` are looked up by key in
 *   `catalogs[locale]` (flat dot-key first, then nested dot-path).
 * - Falls back to `catalogs[defaultLocale]`, then to the literal key
 *   (so missing translations are visible in dev rather than silently
 *   stripped).
 */
export function resolveI18nString(
    value: string,
    locale: string,
    defaultLocale: string,
    catalogs: Record<string, TranslationCatalog> | undefined
): string {
    if (!catalogs) return value;
    const m = I18N_REF.exec(value);
    if (!m) return value;
    const key = m[1].trim();

    const fromCurrent = lookup(catalogs[locale], key);
    if (typeof fromCurrent === "string") return fromCurrent;

    const fromDefault = lookup(catalogs[defaultLocale], key);
    if (typeof fromDefault === "string") return fromDefault;

    return key;
}

function lookup(catalog: TranslationCatalog | undefined, key: string): string | undefined {
    if (!catalog) return undefined;
    // Flat key first.
    const direct = (catalog as Record<string, unknown>)[key];
    if (typeof direct === "string") return direct;
    // Then dot-path traversal through nested catalogs.
    const segs = key.split(".");
    let cur: unknown = catalog;
    for (const seg of segs) {
        if (cur && typeof cur === "object" && seg in (cur as Record<string, unknown>)) {
            cur = (cur as Record<string, unknown>)[seg];
        } else {
            return undefined;
        }
    }
    return typeof cur === "string" ? cur : undefined;
}

/**
 * Recursively walk a value (object/array/scalar) and replace any string
 * matching the `i18n:` reference syntax with its resolved translation.
 *
 * Mutates objects/arrays in place (so callers should pass a copy if the
 * input must be preserved). Returns the resolved value for scalars.
 */
export function resolveI18nDeep<T>(
    value: T,
    locale: string,
    defaultLocale: string,
    catalogs: Record<string, TranslationCatalog> | undefined
): T {
    if (!catalogs) return value;
    if (value == null) return value;
    if (typeof value === "string") {
        return resolveI18nString(value, locale, defaultLocale, catalogs) as unknown as T;
    }
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            (value as unknown[])[i] = resolveI18nDeep((value as unknown[])[i], locale, defaultLocale, catalogs);
        }
        return value;
    }
    if (typeof value === "object") {
        for (const k of Object.keys(value as Record<string, unknown>)) {
            (value as Record<string, unknown>)[k] = resolveI18nDeep(
                (value as Record<string, unknown>)[k],
                locale,
                defaultLocale,
                catalogs
            );
        }
        return value;
    }
    return value;
}
