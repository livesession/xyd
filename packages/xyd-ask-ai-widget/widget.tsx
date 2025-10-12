import { createRoot } from "react-dom/client";

import { AskWidget } from "./src/Widget";

(async () => {
  // Find the script tag that loaded this widget
  const currentScript = document.currentScript as HTMLScriptElement;

  // Extract data attributes
  const config = {
    askAiServer: resolveServerUrl(currentScript),
  };

  console.log(config, 3333);
  
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

// Function to resolve server URL with fallback logic
function resolveServerUrl(currentScript: HTMLScriptElement): string {
  // Priority 1: data-server-url attribute
  if (currentScript?.dataset["serverUrl"]) {
    return currentScript.dataset["serverUrl"];
  }

  // Priority 2: window.__askAi?.serverUrl
  if (window.__askAi?.serverUrl) {
    return window.__askAi.serverUrl;
  }

  // Priority 3: Extract from current script's src
  if (currentScript?.src) {
    try {
      const url = new URL(currentScript.src);
      return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
    } catch (error) {
      console.warn("Failed to parse script src URL:", error);
    }
  }

  // Priority 4: Default fallback
  return "http://localhost:3500";
}
