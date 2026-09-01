import xyd from "@xyd-js/vite-plugin";

export default defineNuxtConfig({
    // The docs project lives inside the app dir — keep nuxt's watcher out of it,
    // or the spawned `xyd dev`'s writes (docs/.xyd) trigger nitro restarts.
    ignore: ["docs/**"],
    vite: {
        plugins: [
            xyd({
                docsRoot: "./docs",
                base: "/docs",
                // nitro assembles the deployable static dir after the vite builds
                outDir: ".output/public",
                command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
            }) as any,
        ],
    },
});
