import {defineConfig} from 'vite';

export default defineConfig(async () => {
    const mdx = await import('@mdx-js/rollup');
    const remix = await import('@remix-run/dev');
    const remarkFrontmatter = await import('remark-frontmatter');
    const remarkMdxFrontmatter = await import('remark-mdx-frontmatter');
    const remarkGfm = await import('remark-gfm');
    const rehypePrettyCode = await import('rehype-pretty-code'); // TODO: for some reasons does not work
    // const { remarkCodeHike, recmaCodeHike } = await import('codehike/mdx'); // TODO: delete because we use this inside components?
    const {remarkMdxToc} = await import("@xyd/content")

    const settings = await import("./settings.json");

    return {
        optimizeDeps: {
            include: ["react/jsx-runtime"],
        },
        resolve: {},
        plugins: [
            mdx.default({
                // providerImportSource: '@mdx-js/react',
                remarkPlugins: [
                    // remarkCodeHike,
                    remarkFrontmatter.default,
                    remarkMdxFrontmatter.default,
                    remarkGfm.default,
                    remarkMdxToc({
                        minDepth: 2,
                    })
                ],
                rehypePlugins: [
                    // recmaCodeHike,
                    // rehypePrettyCode.default, TODO: for some reasons does not work
                ],
            }),
            remix.vitePlugin({
                // routes(defineRoutes) {
                //     return defineRoutes((route) => {
                //         route(
                //             "authentication",
                //             "routes/_index.tsx",
                //             {id: 'routes/__main-index'},
                //             () => {
                //                 route(
                //                     "test",
                //                     "routes/$page.tsx",
                //                     {id: 'routes/__main-index-2'},
                //                 );
                //             });
                //     });
                // },
            }),
            // Add other plugins here
        ],
    };
});
