import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

/**
 * The bearer of an `Authorization` header (`Bearer <token>`, the scheme in any
 * case), or undefined.
 */
export function bearerToken(header: string | string[] | undefined): string | undefined {
    const value = Array.isArray(header) ? header[0] : header;
    const match = value?.match(/^\s*Bearer\s+(\S+)\s*$/i);
    return match ? match[1] : undefined;
}

/**
 * The request's bearer as the SDK's `AuthInfo`: the transport hands it to every
 * message of this request (`extra.authInfo`), and the tools send it on. It is
 * read from each request and kept nowhere else — this server does not check it;
 * the API the tools call does.
 */
export function authInfoOf(headers: { authorization?: string | string[] }): AuthInfo | undefined {
    const token = bearerToken(headers.authorization);
    return token ? { token, clientId: "", scopes: [] } : undefined;
}
