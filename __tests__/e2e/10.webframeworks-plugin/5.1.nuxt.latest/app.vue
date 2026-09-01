<script setup>
const BRAND_PATH = "M13.4642 19.8295h8.9218c.2834 0 .5618-.0723.8072-.2098a1.5899 1.5899 0 0 0 .5908-.5732 1.5293 1.5293 0 0 0 .216-.783 1.529 1.529 0 0 0-.2167-.7828L17.7916 7.4142a1.5904 1.5904 0 0 0-.5907-.573 1.6524 1.6524 0 0 0-.807-.2099c-.2833 0-.5616.0724-.807.2098a1.5904 1.5904 0 0 0-.5907.5731L13.4642 9.99l-2.9954-5.0366a1.5913 1.5913 0 0 0-.591-.573 1.6533 1.6533 0 0 0-.8071-.2098c-.2834 0-.5617.0723-.8072.2097a1.5913 1.5913 0 0 0-.591.573L.2168 17.4808A1.5292 1.5292 0 0 0 0 18.2635c-.0001.2749.0744.545.216.783a1.59 1.59 0 0 0 .5908.5732c.2454.1375.5238.2098.8072.2098h5.6003c2.219 0 3.8554-.9454 4.9813-2.7899l2.7337-4.5922L16.3935 9.99l4.3944 7.382h-5.8586ZM7.123 17.3694l-3.9083-.0009 5.8586-9.8421 2.9232 4.921-1.9572 3.2892c-.7478 1.1967-1.5972 1.6328-2.9163 1.6328z";
</script>

<template>
    <div>
        <header>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
            <span class="name">Nuxt</span>
            <nav><a href="/docs">Docs</a></nav>
        </header>
        <main>
            <div>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
                <h1 id="host-marker">Host Nuxt App</h1>
                <p class="tag">A Nuxt site with xyd docs mounted at /docs — one build, one origin.</p>
            </div>
        </main>
    </div>
</template>

<style>
:root{--brand:#00DC82}
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
.jsnote{color:#565963;font-size:12px;margin-top:32px}
</style>
