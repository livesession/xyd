#!/usr/bin/env node

import {run} from "./src/run";

console.log("test")

run().then(
    () => {
        process.exit(0);
    },
    (error: unknown) => {
        if (error) console.error(error);
        process.exit(1);
    }
);
