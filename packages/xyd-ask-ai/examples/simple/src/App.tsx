import { AskAI, useAskAI } from "@xyd-js/ask-ai/react";

import "./index.css";

export default function App() {
  const { messages, submit, disabled } = useAskAI();

  return (
    <main>
      <h1>Ask AI + MCP on the edge</h1>
      <p>
        This is a simple example of how to use Ask AI + MCP on the edge
        <br /> deployed on Netlify Edge Functions.
      </p>
      <AskAI onSubmit={submit} disabled={disabled}>
        {messages.map((message) => (
          <AskAI.Message
            key={message.id}
            content={message.content}
            type={message.type}
            showActions={message.showActions}
          />
        ))}
      </AskAI>
    </main>
  );
}
