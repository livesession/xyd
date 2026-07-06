/**
 * Resource route for `/.well-known/*`. Chrome DevTools (Automatic Workspace
 * Folders) and other agents probe URLs like
 * `/.well-known/appspecific/com.chrome.devtools.json`; without a matching route,
 * React Router throws "No route matches URL" through the error boundary and logs
 * a stack. Answer 404 quietly instead.
 */
export function loader() {
  return new Response(null, { status: 404 });
}
