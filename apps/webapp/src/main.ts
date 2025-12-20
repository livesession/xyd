import { app, screen, BrowserWindow, ipcMain, safeStorage } from "electron";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import started from "electron-squirrel-startup";
import fs from "node:fs";
import {ReactContent, stdContent} from "@xyd-js/components/content"
import {Heading} from "@xyd-js/components/writer"
import {CodeSample} from "@xyd-js/components/coder"

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";
import React from "react";
import ReactDOMServer from "react-dom/server";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const contentComponents = stdContent.call(new ReactContent());

// Path to store encrypted token and connected repositories
const TOKEN_FILE_PATH = path.join(app.getPath("userData"), "github-token.enc");
const REPOSITORIES_FILE_PATH = path.join(
  app.getPath("userData"),
  "connected-repositories.json"
);

// IPC handlers for GitHub token management
ipcMain.handle("github-token:save", async (_event, token: string) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Encryption is not available on this system");
    }

    const encryptedToken = safeStorage.encryptString(token);
    fs.writeFileSync(TOKEN_FILE_PATH, encryptedToken);
    return { success: true };
  } catch (error) {
    console.error("Failed to save GitHub token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("github-token:get", async () => {
  try {
    if (!fs.existsSync(TOKEN_FILE_PATH)) {
      return { success: true, token: null };
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Encryption is not available on this system");
    }

    const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
    const token = safeStorage.decryptString(encryptedToken);
    return { success: true, token };
  } catch (error) {
    console.error("Failed to retrieve GitHub token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("github-token:delete", async () => {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete GitHub token:", error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC handlers for repository management
ipcMain.handle("repositories:get-connected", async () => {
  try {
    if (!fs.existsSync(REPOSITORIES_FILE_PATH)) {
      return { success: true, repositories: [] };
    }

    const data = fs.readFileSync(REPOSITORIES_FILE_PATH, "utf-8");
    const repositories = JSON.parse(data);
    return { success: true, repositories };
  } catch (error) {
    console.error("Failed to get connected repositories:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("repositories:connect", async (_event, repository) => {
  try {
    let repositories = [];

    if (fs.existsSync(REPOSITORIES_FILE_PATH)) {
      const data = fs.readFileSync(REPOSITORIES_FILE_PATH, "utf-8");
      repositories = JSON.parse(data);
    }

    // Check if repository is already connected
    const exists = repositories.find((r: any) => r.id === repository.id);
    if (!exists) {
      repositories.push(repository);
      fs.writeFileSync(
        REPOSITORIES_FILE_PATH,
        JSON.stringify(repositories, null, 2)
      );
    }

    return { success: true, repositories };
  } catch (error) {
    console.error("Failed to connect repository:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "repositories:disconnect",
  async (_event, repositoryId: number) => {
    try {
      if (!fs.existsSync(REPOSITORIES_FILE_PATH)) {
        return { success: true, repositories: [] };
      }

      const data = fs.readFileSync(REPOSITORIES_FILE_PATH, "utf-8");
      let repositories = JSON.parse(data);

      repositories = repositories.filter((r: any) => r.id !== repositoryId);
      fs.writeFileSync(
        REPOSITORIES_FILE_PATH,
        JSON.stringify(repositories, null, 2)
      );

      return { success: true, repositories };
    } catch (error) {
      console.error("Failed to disconnect repository:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// IPC handlers for GitHub API operations
ipcMain.handle(
  "github:get-tree",
  async (_event, owner: string, repo: string, branch: string) => {
    try {
      // Get the stored token
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        return { success: false, error: "No GitHub token configured" };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: "Encryption is not available" };
      }

      const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
      const token = safeStorage.decryptString(encryptedToken);

      // Fetch repository tree from GitHub API
      const https = await import("https");

      return new Promise((resolve) => {
        const options = {
          hostname: "api.github.com",
          path: `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Electron-App",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve({ success: true, data: JSON.parse(data) });
            } else {
              resolve({
                success: false,
                error: `GitHub API error: ${res.statusCode}`,
              });
            }
          });
        });

        req.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });

        req.end();
      });
    } catch (error) {
      console.error("Failed to fetch repository tree:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle(
  "github:get-file",
  async (_event, owner: string, repo: string, path: string) => {
    try {
      // Get the stored token
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        return { success: false, error: "No GitHub token configured" };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: "Encryption is not available" };
      }

      const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
      const token = safeStorage.decryptString(encryptedToken);

      // Fetch file content from GitHub API
      const https = await import("https");

      return new Promise((resolve) => {
        const options = {
          hostname: "api.github.com",
          path: `/repos/${owner}/${repo}/contents/${path}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Electron-App",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              const fileData = JSON.parse(data);
              // Decode base64 content
              const content = Buffer.from(fileData.content, "base64").toString(
                "utf-8"
              );
              resolve({ success: true, content });
            } else {
              resolve({
                success: false,
                error: `GitHub API error: ${res.statusCode}`,
              });
            }
          });
        });

        req.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });

        req.end();
      });
    } catch (error) {
      console.error("Failed to fetch file:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

const createWindow = async () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    show: true, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Log when window is ready
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );

  // Show window when ready-to-show
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler for GitHub commits
ipcMain.handle(
  "github:get-commits",
  async (_event, owner: string, repo: string, limit: number = 5) => {
    try {
      // Get the stored token
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        return { success: false, error: "No GitHub token configured" };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: "Encryption is not available" };
      }

      const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
      const token = safeStorage.decryptString(encryptedToken);

      // Fetch commits from GitHub API
      const https = await import("https");

      return new Promise((resolve) => {
        const options = {
          hostname: "api.github.com",
          path: `/repos/${owner}/${repo}/commits?per_page=${limit}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Electron-App",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve({ success: true, commits: JSON.parse(data) });
            } else {
              resolve({
                success: false,
                error: `GitHub API error: ${res.statusCode}`,
              });
            }
          });
        });

        req.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });

        req.end();
      });
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle(
  "editor:compile-markdown",
  async (_event, markdown: string, fileName: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mdPlugins = await markdownPlugins(
          {
            maxDepth: 2,
          },
          {}
        );

        const contentFs = new ContentFS(
          {},
          mdPlugins.remarkPlugins,
          mdPlugins.rehypePlugins,
          mdPlugins.recmaPlugins
        );

        const compiledContent = await contentFs.compileContent(
          markdown,
          fileName
        );

        // Don't execute MDX on the server - just return the compiled code
        // The client will handle rendering with the actual React components

        resolve({
            success: true,
            compiledContent,
            // You can also return the compiled code if needed
            code: compiledContent
        });
      } catch (error) {
        console.error("Failed to compile markdown:", error);
        reject({ success: false, error: (error as Error).message });
      }
    });
  }
);


const createElementWithKeys = (type: any, props: any) => {
  // Process children to add keys to all elements
  const processChildren = (childrenArray: any[]): any[] => {
      return childrenArray.map((child, index) => {
          // If the child is a React element and doesn't have a key, add one
          if (React.isValidElement(child) && !child.key) {
              return React.cloneElement(child, { key: `mdx-${index}` });
          }
          // If the child is an array, process it recursively
          if (Array.isArray(child)) {
              return processChildren(child);
          }
          return child;
      });
  };

  // Handle both cases: children as separate args or as props.children
  let processedChildren;

  if (props && props.children) {
      if (Array.isArray(props.children)) {
          processedChildren = processChildren(props.children);
      } else if (React.isValidElement(props.children) && !props.children.key) {
          // Single child without key
          processedChildren = React.cloneElement(props.children, { key: 'mdx-child' });
      } else {
          // Single child with key or non-React element
          processedChildren = props.children;
      }
  } else {
      processedChildren = [];
  }

  // Create the element with processed children
  return React.createElement(type, {
      ...props,
      children: processedChildren
  });
};


// TODO: move to content?
function mdxExport(code: string) {
  // Create a wrapper around React.createElement that adds keys to elements in lists
  const scope = {
      Fragment: React.Fragment,
      jsxs: createElementWithKeys,
      jsx: createElementWithKeys,
      jsxDEV: createElementWithKeys,
  }
  const fn = new Function(...Object.keys(scope), code)

  return fn(scope)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
