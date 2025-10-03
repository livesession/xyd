import { useState } from "react";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  showActions?: boolean;
}

// TODO: stream decodeer

export function useAskAI(askUrl?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [askDisabled, setAskDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: CustomEvent<{ message: string }>) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: event.detail.message,
      type: "user",
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);

    // Start with empty assistant message
    const assistantId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantId,
      content: "",
      type: "assistant",
      showActions: false,
    };

    setAskDisabled(true);
    setLoading(true);
    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Make real request to the API
      const response = await fetch(askUrl || "/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: event.detail.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let currentContent = "";

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            currentContent += chunk;

            // Set loading to false when we start receiving content
            if (currentContent && loading) {
              setLoading(false);
            }

            // Update the assistant message with new content immediately
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: currentContent }
                  : msg
              )
            );
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          throw error;
        }
      };

      await processStream();

      // Mark as complete and show actions
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, showActions: true } : msg
        )
      );
    } catch (error) {
      console.error("Error making request:", error);

      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
              }
            : msg
        )
      );
    } finally {
      setAskDisabled(false);
      setLoading(false);
    }
  };

  return {
    messages,
    submit: handleSubmit,
    disabled: askDisabled,
    loading,
  };
}
