import { useState, useEffect, useRef } from "react";

import { ProseMd } from "@prose-sdk/react";

import { AskAI, useAskAI } from "@xyd-js/ask-ai/react";

import "./index.css";

export default function App() {
  const { messages, submit, disabled, loading } = useAskAI(
    import.meta.env.ASK_URL || "http://localhost:3500/ask"
  );
  const [dots, setDots] = useState(1);
  const ref = useRef<any>(null);
  const [showDockInput, setShowDockInput] = useState(true);

  const lastMessage = messages?.[messages.length - 1];
  const isWaitingForAssistant =
    (messages.length > 0 && lastMessage?.type === "user") ||
    (lastMessage?.type === "assistant" && lastMessage?.content === "");

  useEffect(() => {
    ref.current.scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  const getPlaceholder = () => {
    if (loading) {
      return `Loading${".".repeat(dots)}`;
    }
    return "Ask a question";
  };

  return (
    <main>
      <h1>AI components demo</h1>
      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <button data-ask-ai-trigger>Custom Toggle Button</button>
        <button onClick={() => setShowDockInput(!showDockInput)}>
          On/Off Dock Input
        </button>
      </div>
      <AskAI
        onSubmit={submit as any}
        disabled={disabled}
        placeholder={getPlaceholder()}
        dockInput={showDockInput}
        ref={ref}
      >
        <div slot="title">
          <span aria-hidden="true">✨</span>
          Assistant
        </div>

        {messages.map((message) => (
          <AskAI.Message
            key={message.id}
            type={message.type}
            content={message.type === "user" ? message.content : undefined}
          >
            {message.type === "assistant" ? (
              <_Message message={message.content} />
            ) : null}
          </AskAI.Message>
        ))}

        {loading && isWaitingForAssistant ? (
          <AskAI.Message
            type="assistant"
            content={`Loading${".".repeat(dots)}`}
          />
        ) : null}
      </AskAI>
    </main>
  );
}

function _Message({ message }: { message: string }) {
  return <ProseMd content={message} />;
}
