import { createSSRApp } from "vue";
import App from "./App.vue";

// SSR requires a fresh app instance per request
export function createApp() {
    return createSSRApp(App);
}
