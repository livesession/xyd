#!/usr/bin/env node

import { cli } from "./src/cli";

cli().then(
    () => {
        process.exit(0);
    },
    (error: unknown) => {
        if (error) console.error(error);
        process.exit(1);
    }
);
