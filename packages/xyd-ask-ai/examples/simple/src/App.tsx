import { AskAI, useAskAI } from "@xyd-js/ask-ai/react";
import { useState, useEffect } from "react";

import "./index.css";


export default function App() {
  const { messages, submit, disabled, loading } = useAskAI("http://localhost:3500/ask");
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  const getPlaceholder = () => {
    if (loading) {
      return `Loading${'.'.repeat(dots)}`;
    }
    return "Ask a question";
  };

  return (
    <main>
      <h1>Ask AI + MCP on the edge</h1>
      <p>
        This is a simple example of how to use Ask AI + MCP on the edge
        <br /> deployed on Netlify Edge Functions.
      </p>
      <AskAI 
        onSubmit={submit as any} 
        disabled={disabled} 
        placeholder={getPlaceholder()}
      >
        {messages.map((message) => (
          <AskAI.Message
            key={message.id}
            content={message.content}
            type={message.type}
          />
        ))}
      </AskAI>
    </main>
  );
}
