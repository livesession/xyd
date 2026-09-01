import { renderToString } from "vue/server-renderer";
import { createApp } from "./main.js";

export async function render(_url) {
    const app = createApp();
    const html = await renderToString(app);
    return { html };
}
