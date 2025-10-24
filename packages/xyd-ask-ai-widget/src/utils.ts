import path from "node:path";
import fs from "node:fs/promises";

import { Settings } from "./settings";

import { replaceEnvVars } from "@xyd-js/cli-sdk";

function getSettingsPath(): string {
  return path.join(process.cwd(), "askai.json");
}

export async function loadSetting(): Promise<Settings> {
  const settingsPath = getSettingsPath();
  try {
    await fs.access(settingsPath);
  } catch (error) {
    const settings = newSettings();
    ensureSettings(settings);

    return settings;
  }

  const settingsJSON = await fs.readFile(settingsPath, "utf-8");
  let settings = JSON.parse(settingsJSON);
  settings = replaceEnvVars(settings, true);

  ensureSettings(settings);

  return settings;
}

function newSettings(): Settings {
  return {
    ai: {
      provider: "",
      model: "",
      token: "",
    },
    mcp: {
      url: "",
    },
    headers: {},
  };
}

function ensureSettings(settings: Settings) {
  if (!settings.ai) {
    settings.ai = {
      provider: "",
      model: "",
      token: "",
    };
  }

  if (!settings.mcp) {
    settings.mcp = {
      url: "",
    };
  }

  if (!settings.sources) {
    settings.sources = {
      openapi: "",
      llmsTxt: "",
    };
  }

  if (process.env.OPENAPI_SOURCE) {
    settings.sources.openapi = process.env.OPENAPI_SOURCE;
    console.log("(env settings): using OPENAPI_SOURCE");
  }

  if (process.env.LLMS_TXT_SOURCE) {
    settings.sources.llmsTxt = process.env.LLMS_TXT_SOURCE;
    console.log("(env settings): using LLMS_TXT_SOURCE");
  }

  if (process.env.MCP_URL) {
    settings.mcp.url = process.env.MCP_URL;
    console.log("(env settings): using MCP_URL");
  }

  if (process.env.AI_PROVIDER) {
    settings.ai.provider = process.env.AI_PROVIDER;
    console.log("(env settings): using AI_PROVIDER");
  }

  if (process.env.AI_MODEL) {
    settings.ai.model = process.env.AI_MODEL;
    console.log("(env settings): using AI_MODEL");
  }

  if (process.env.AI_TOKEN) {
    settings.ai.token = process.env.AI_TOKEN;
    console.log("(env settings): using AI_TOKEN");
  }

  if (!settings.headers || !Object.keys(settings.headers).length) {
    settings.headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Max-Age": "86400",
    };
  }
}
