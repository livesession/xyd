// ../apiatlas-api/src/http.ts
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req)
    chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}
async function handleHttpProxy(req, res) {
  let envelope;
  try {
    envelope = await readJsonBody(req);
  } catch {
    json(res, 400, { error: "http/proxy requires a JSON envelope" });
    return;
  }
  if (!/^https?:\/\//i.test(envelope.url ?? "")) {
    json(res, 400, { error: "http/proxy requires an http(s) `url`" });
    return;
  }
  try {
    const method = (envelope.method || "GET").toUpperCase();
    const upstream = await fetch(envelope.url, {
      method,
      headers: envelope.headers,
      body: method === "GET" || method === "HEAD" ? undefined : envelope.bodyText,
      redirect: "follow"
    });
    const headers = {};
    upstream.headers.forEach((v, k) => {
      headers[k] = v;
    });
    const bodyBase64 = Buffer.from(await upstream.arrayBuffer()).toString("base64");
    json(res, 200, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
      bodyBase64
    });
  } catch (err) {
    json(res, 502, { error: err instanceof Error ? err.message : String(err) });
  }
}

// src/vite-plugin.ts
function apiatlasWidgetProxy(options = {}) {
  const base = options.basePath ?? "/apiatlas-api";
  const route = `${base}/http/proxy`;
  return {
    name: "apiatlas-widget-proxy",
    configureServer(server) {
      server.middlewares.use(route, (req, res, next) => {
        if (req.method !== "POST")
          return next();
        handleHttpProxy(req, res).catch((err) => {
          res.statusCode = 502;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : "proxy failed" }));
        });
      });
    }
  };
}
var vite_plugin_default = apiatlasWidgetProxy;
export {
  handleHttpProxy,
  vite_plugin_default as default,
  apiatlasWidgetProxy
};
