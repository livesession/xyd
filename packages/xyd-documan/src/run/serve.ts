import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

import {createRequestHandler} from "@react-router/express";
import type {ServerBuild} from "react-router";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";
import getPort from "get-port";

function parseNumber(raw?: string) {
    if (raw === undefined) return undefined;
    let maybe = Number(raw);
    if (Number.isNaN(maybe)) return undefined;
    return maybe;
}

export async function serve() {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

    sourceMapSupport.install({
        retrieveSourceMap: function (source) {
            let match = source.startsWith("file://");
            if (match) {
                let filePath = url.fileURLToPath(source);
                let sourceMapPath = `${filePath}.map`;
                if (fs.existsSync(sourceMapPath)) {
                    return {
                        url: source,
                        map: fs.readFileSync(sourceMapPath, "utf8"),
                    };
                }
            }
            return null;
        },
    });

    let port = parseNumber(process.env.PORT) ?? (await getPort({port: 3000}));

    let buildPathArg = path.join(process.cwd(), ".xyd/build/server/index.js")

    if (!buildPathArg) {
        console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
        process.exit(1);
    }

    let buildPath = path.resolve(buildPathArg);

    let build: ServerBuild = await import(url.pathToFileURL(buildPath).href);

    let onListen = () => {
        let address =
            process.env.HOST ||
            Object.values(os.networkInterfaces())
                .flat()
                .find((ip) => String(ip?.family).includes("4") && !ip?.internal)
                ?.address;

        if (!address) {
            console.log(`[xyd-serve] http://localhost:${port}`);
        } else {
            console.log(
                `[xyd-serve] http://localhost:${port} (http://${address}:${port})`
            );
        }
    };

    build = {
        ...build,
        assetsBuildDirectory: path.join(process.cwd(), ".xyd/build/client")
    }

    let app = express();
    app.disable("x-powered-by");
    app.use(compression());
    app.use(
        path.posix.join(build.publicPath, "assets"),
        express.static(path.join(build.assetsBuildDirectory, "assets"), {
            immutable: true,
            maxAge: "1y",
        })
    );
    app.use(build.publicPath, express.static(build.assetsBuildDirectory));
    app.use(express.static("public", {maxAge: "1h"}));
    app.use(morgan("tiny"));

    app.all(
        "*",
        createRequestHandler({
            build,
            mode: process.env.NODE_ENV,
        })
    );

    let server = process.env.HOST
        ? app.listen(port, process.env.HOST, onListen)
        : app.listen(port, onListen);

    ["SIGTERM", "SIGINT"].forEach((signal) => {
        process.once(signal, () => server?.close(console.error));
    });
}
