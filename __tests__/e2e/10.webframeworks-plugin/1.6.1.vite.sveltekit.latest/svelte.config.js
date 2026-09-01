import adapter from "@sveltejs/adapter-static";

export default {
    kit: {
        adapter: adapter(),
        prerender: {
            // the header links to /docs, which lives OUTSIDE the app (merged in by
            // @xyd-js/vite-plugin after the build) — don't fail the crawl on it
            handleHttpError: ({ path, message }) => {
                if (path === "/docs" || path.startsWith("/docs/")) return;
                throw new Error(message);
            },
        },
    },
};
