// The page CSS is emitted INSIDE the SSR-rendered string (not the
// index.html template): vite 8's dev transformIndexHtml chokes on inline
// <style> blocks in a middlewareMode template (html-proxy resolve bug), and
// the render output replaces <!--app-html--> AFTER the transform.
export function renderApp() {
    return `<style>:root{--brand:#646CFF}
*{margin:0;box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0c0f;color:#e8e9ec;min-height:100vh}
header{display:flex;align-items:center;gap:12px;padding:16px 32px;border-bottom:1px solid #23252b}
header svg{width:28px;height:28px;fill:var(--brand)}
header .name{font-weight:600;font-size:17px}
header nav{margin-left:auto}
header nav a{color:#0b0c0f;background:var(--brand);padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:600}
main{display:grid;place-items:center;min-height:calc(100vh - 62px);text-align:center;padding:24px}
main svg{width:72px;height:72px;fill:var(--brand);margin-bottom:24px}
h1{font-size:40px;letter-spacing:-.02em}
p.tag{color:#9a9ca6;margin-top:12px;font-size:17px}
.jsnote{color:#565963;font-size:12px;margin-top:32px}</style><header><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316zm14.976-7.926L17.284 3.74l-.544 1.887 2.077-.4a.8.8 0 0 1 .84.369.8.8 0 0 1 .034.783L12.9 19.93l-.013.025-.015.023-.122.19a.801.801 0 0 1-.672.37.826.826 0 0 1-.634-.302.8.8 0 0 1-.16-.67l1.029-4.981-1.12.34a.81.81 0 0 1-.86-.262.802.802 0 0 1-.165-.67l.63-3.08-2.027.468a.808.808 0 0 1-.768-.233.81.81 0 0 1-.217-.6l.389-6.57-7.44-1.33a.612.612 0 0 0-.64.906L11.58 23.691a.612.612 0 0 0 1.066-.004l11.26-20.135a.612.612 0 0 0-.644-.9z"/></svg><span class="name">Vite SSR</span><nav><a href="/docs">Docs</a></nav></header><main><div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316zm14.976-7.926L17.284 3.74l-.544 1.887 2.077-.4a.8.8 0 0 1 .84.369.8.8 0 0 1 .034.783L12.9 19.93l-.013.025-.015.023-.122.19a.801.801 0 0 1-.672.37.826.826 0 0 1-.634-.302.8.8 0 0 1-.16-.67l1.029-4.981-1.12.34a.81.81 0 0 1-.86-.262.802.802 0 0 1-.165-.67l.63-3.08-2.027.468a.808.808 0 0 1-.768-.233.81.81 0 0 1-.217-.6l.389-6.57-7.44-1.33a.612.612 0 0 0-.64.906L11.58 23.691a.612.612 0 0 0 1.066-.004l11.26-20.135a.612.612 0 0 0-.644-.9z"/></svg><h1 id="host-marker">Host SSR Vanilla App</h1><p class="tag">A server-rendered Vite site with xyd docs mounted at /docs — one build, one origin.</p></div></main>`;
}
