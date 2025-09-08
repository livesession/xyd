export function getCallbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/api/auth/google/callback`;
}