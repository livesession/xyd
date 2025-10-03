import { handler } from "@xyd-js/ask-ai/node";

const server = Bun.serve({
  port: 3500,
  async fetch(request: Request) {
    // Use the handler from xyd-ask-ai
    return handler(request);
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
