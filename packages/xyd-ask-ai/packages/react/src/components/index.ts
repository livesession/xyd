import React from "react";

import {
  createComponent,
  type ReactWebComponent,
  type EventName,
} from "@lit/react";

import { 
  AskAI as AskAIElement,
  AskAIMessage as AskAIMessageElement
 } from "../../../components";

export type AskAIComponent = ReactWebComponent<AskAIElement> & {
  Message: ReactWebComponent<AskAIMessageElement>;
} & {
  onSubmit?: (event: CustomEvent<{ message: string }>) => void;
};

// @ts-ignore - fix this
export const AskAI: AskAIComponent = createComponent({
  tagName: "ask-ai",
  elementClass: AskAIElement,
  react: React,
  events: {
    onSubmit: "submit" as EventName<CustomEvent<{ message: string }>>,
  },
});

AskAI.Message = createComponent({
  tagName: "ask-ai-message",
  elementClass: AskAIMessageElement,
  react: React,
});