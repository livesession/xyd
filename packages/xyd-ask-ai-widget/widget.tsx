import { createRoot } from "react-dom/client";

import { AskWidget } from "./src/Widget";

(async () => {
  // Find the script tag that loaded this widget
  const currentScript = document.currentScript as HTMLScriptElement;

  // Extract data attributes
  const config = {
    askAiServer:
      currentScript?.dataset["data-server-url"] || window.__askAi?.serverUrl,
  };

  if (!config?.askAiServer) {
    config.askAiServer = "http://localhost:3500";
  }

  // Create a container div and append it to body
  const container = document.createElement("div");
  container.id = "xyd-ask-ai-widget";
  document.body.appendChild(container);

  // Render to the container
  const root = createRoot(container);
  root.render(
    <AskWidget
      config={{
        endpointURL: `${config.askAiServer}/ask`,
      }}
    />
  );
})();
