import {dev} from "@xyd-js/documan"

async function startServer() {
    await dev()
}

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});