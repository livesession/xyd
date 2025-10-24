import { useState, useEffect, useRef } from "react";

import { ProseMd } from "@prose-sdk/react";

import { AskAI, useAskAI } from "@xyd-js/ask-ai/react";

interface WidgetConfig {
  endpointURL?: string;
  dockInput: boolean;
}

interface AskWidgetProps {
  config?: WidgetConfig;
}

export function AskWidget({ config = {} }: AskWidgetProps) {
  const { messages, submit, disabled, loading } = useAskAI(
    config?.endpointURL
  );
  const [dots, setDots] = useState(1);
  const ref = useRef<any>(null);

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
    <AskAI
      onSubmit={submit as any}
      disabled={disabled}
      placeholder={getPlaceholder()}
      dockInput={config?.dockInput || undefined}
      ref={ref}
    >
      <div slot="title">
        <span aria-hidden="true">✨</span>
        {config?.projectName || "Assistant"}
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
  );
}

function _Message({ message }: { message: string }) {
  return <ProseMd languges={['javascript', 'jsx', 'tsx', 'ts', 'txt', 'md', 'mdx', 'bash']} content={message} />;
}
