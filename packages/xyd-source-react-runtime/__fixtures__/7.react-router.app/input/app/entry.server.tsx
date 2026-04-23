import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";

export default function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
) {
    return new Promise((resolve, reject) => {
        const { pipe } = renderToPipeableStream(
            <ServerRouter context={routerContext} url={request.url} />,
            {
                onShellReady() {
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);

                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: responseStatusCode,
                        }),
                    );
                    pipe(body);
                },
                onShellError(error: unknown) {
                    reject(error);
                },
            },
        );
    });
}
