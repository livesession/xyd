import { createRoot } from "react-dom/client";

import { AskWidget } from "./src/Widget";

(async () => {
  // Find the script tag that loaded this widget
  const currentScript = document.currentScript as HTMLScriptElement;

  // Extract data attributes
  const config = {
    askAiServer:
      currentScript?.dataset["data-server-url"] || process.env.ASK_AI_URL,
  };

  // Create a container div and append it to body
  const container = document.createElement("div");
  container.id = "xyd-ask-ai-widget";
  document.body.appendChild(container);

  // Render to the container
  const root = createRoot(container);
  root.render(<AskWidget config={config} />);
})();
