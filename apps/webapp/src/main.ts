import { app, screen, BrowserWindow, ipcMain, safeStorage } from "electron";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import started from "electron-squirrel-startup";
import fs from "node:fs";
import {ReactContent, stdContent} from "@xyd-js/components/content"
import {Heading} from "@xyd-js/components/writer"
import {CodeSample} from "@xyd-js/components/coder"
import { spawn, ChildProcess } from "node:child_process";

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

// XYD dev server management
let xydServerProcess: ChildProcess | null = null;
let xydServerPort: number | null = null;

// Path to store encrypted token and connected repositories
const TOKEN_FILE_PATH = path.join(app.getPath("userData"), "github-token.enc");
const REPOSITORIES_FILE_PATH = path.join(
  app.getPath("userData"),
  "connected-repositories.json"
);

// Function to get synced repository path for a given repository
function getSyncedRepoPath(owner: string, repoName: string): string {
  const reposDir = path.join(app.getPath("userData"), "synced-repos");
  const repoPath = path.join(reposDir, owner, repoName);

  // Ensure directory exists
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }

  return repoPath;
}

// Function to get "base" (remote) repository path for diffing
function getSyncedRepoBaseContentPath(owner: string, repo: string): string {
  const baseDir = path.join(app.getPath("userData"), "synced-repos-base");
  const baseRepoPath = path.join(baseDir, owner, repo);

  if (!fs.existsSync(baseRepoPath)) {
    fs.mkdirSync(baseRepoPath, { recursive: true });
  }

  return baseRepoPath;
}

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
  "github:get-branches",
  async (_event, owner: string, repo: string) => {
    try {
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        return { success: false, error: "No GitHub token configured" };
      }
      const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
      const token = safeStorage.decryptString(encryptedToken);

      const https = await import("https");
      return new Promise((resolve) => {
        const options = {
          hostname: "api.github.com",
          path: `/repos/${owner}/${repo}/branches`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Electron-App",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            try {
              if (res.statusCode === 200) {
                const branches = JSON.parse(data);
                resolve({ success: true, branches: branches.map((b: any) => b.name) });
              } else {
                resolve({ success: false, error: JSON.parse(data).message || "Failed to fetch branches" });
              }
            } catch (e) {
              resolve({ success: false, error: "Failed to parse branches response" });
            }
          });
        });

        req.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });
        req.end();
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

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
  async (_event, owner: string, repo: string, filePath: string) => {
    try {
      // First check if file exists in synced local storage
      const syncedRepoPath = getSyncedRepoPath(owner, repo);
      const localFilePath = path.join(syncedRepoPath, filePath);

      if (fs.existsSync(localFilePath)) {
        const content = fs.readFileSync(localFilePath, "utf-8");
        return { success: true, content, fromLocal: true };
      }

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
          path: `/repos/${owner}/${repo}/contents/${filePath}`,
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

              // Save to local synced storage
              const dir = path.dirname(localFilePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(localFilePath, content, "utf-8");

              resolve({ success: true, content, fromLocal: false });
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

// IPC handler for getting the "base" (remote) version of a file
ipcMain.handle(
  "github:get-base-file",
  async (_event, owner: string, repo: string, filePath: string, branch: string) => {
    try {
      if (!owner || !repo || !filePath || !branch) {
        console.error("Missing required arguments for get-base-file:", { owner, repo, filePath, branch });
        return { success: false, error: "Missing required arguments" };
      }

      const baseRepoPath = getSyncedRepoBaseContentPath(owner, repo);
      // We store base files in a branch-specific subfolder to allow switching branches
      const baseFilePath = path.join(baseRepoPath, branch, filePath);

      // If we have it cached locally in the base path, return it
      if (fs.existsSync(baseFilePath)) {
        const content = fs.readFileSync(baseFilePath, "utf-8");
        return { success: true, content };
      }

      // Otherwise, fetch from GitHub API
      if (!fs.existsSync(TOKEN_FILE_PATH)) {
        return { success: false, error: "No GitHub token configured" };
      }

      const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
      const token = safeStorage.decryptString(encryptedToken);

      const https = await import("https");

      return new Promise((resolve) => {
        const options = {
          hostname: "api.github.com",
          path: `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Electron-App",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            if (res.statusCode === 200) {
              const fileData = JSON.parse(data);
              const content = Buffer.from(fileData.content, "base64").toString("utf-8");

              // Cache in the base path
              const dir = path.dirname(baseFilePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(baseFilePath, content, "utf-8");

              resolve({ success: true, content });
            } else {
              resolve({ success: false, error: `GitHub API error: ${res.statusCode}` });
            }
          });
        });

        req.on("error", (error) => { resolve({ success: false, error: error.message }); });
        req.end();
      });
    } catch (error) {
      console.error("Failed to fetch base file:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// IPC handler for getting all modified files compared to base
ipcMain.handle(
  "github:get-modified-files",
  async (_event, owner: string, repo: string, branch: string) => {
    try {
      if (!owner || !repo || !branch) {
        return { success: false, error: "Missing required arguments" };
      }

      const syncedRepoPath = getSyncedRepoPath(owner, repo);
      const baseRepoPath = path.join(getSyncedRepoBaseContentPath(owner, repo), branch);

      if (!fs.existsSync(syncedRepoPath) || !fs.existsSync(baseRepoPath)) {
        return { success: true, modifiedFiles: [] };
      }

      const modifiedFiles: string[] = [];

      const scanDirectory = (currentDir: string, relativePath: string = "") => {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
          // Skip .git and node_modules
          if (item === ".git" || item === "node_modules") continue;

          const fullPath = path.join(currentDir, item);
          const itemRelativePath = path.join(relativePath, item);
          const normalizedRelativePath = itemRelativePath.split(path.sep).join("/");
          const baseFilePath = path.join(baseRepoPath, itemRelativePath);

          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            scanDirectory(fullPath, itemRelativePath);
          } else if (stats.isFile()) {
            // If file exists in base, compare them
            if (fs.existsSync(baseFilePath)) {
              const currentContent = fs.readFileSync(fullPath, "utf-8").replace(/\r\n/g, "\n");
              const baseContent = fs.readFileSync(baseFilePath, "utf-8").replace(/\r\n/g, "\n");

              if (currentContent !== baseContent) {
                modifiedFiles.push(normalizedRelativePath);
              }
            } else {
              // If it's a new file not in the base tree, it's modified (added)
              modifiedFiles.push(normalizedRelativePath);
            }
          }
        }
      };

      scanDirectory(syncedRepoPath);
      return { success: true, modifiedFiles };
    } catch (error) {
      console.error("Failed to get modified files:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// IPC handler for saving file to local synced storage
ipcMain.handle(
  "github:save-file",
  async (_event, owner: string, repo: string, filePath: string, content: string) => {
    try {
      const syncedRepoPath = getSyncedRepoPath(owner, repo);
      const localFilePath = path.join(syncedRepoPath, filePath);

      // Ensure directory exists
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(localFilePath, content, "utf-8");

      return { success: true };
    } catch (error) {
      console.error("Failed to save file:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// IPC handler for getting synced repository path
ipcMain.handle(
  "github:get-synced-repo-path",
  async (_event, owner: string, repo: string) => {
    try {
      const repoPath = getSyncedRepoPath(owner, repo);
      return { success: true, path: repoPath };
    } catch (error) {
      console.error("Failed to get synced repo path:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// IPC handler for syncing entire repository
ipcMain.handle(
  "github:sync-repository",
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

      const https = await import("https");

      // First, get the repository tree
      const treeData: any = await new Promise((resolve, reject) => {
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
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode}`));
            }
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.end();
      });

      // Filter for blob (file) entries only
      const files = treeData.tree.filter((item: any) => item.type === "blob");
      const syncedRepoPath = getSyncedRepoPath(owner, repo);

      let syncedCount = 0;
      let failedCount = 0;

      // Download each file
      for (const file of files) {
        try {
          // Fetch file content
          const fileContent: any = await new Promise((resolve, reject) => {
            const options = {
              hostname: "api.github.com",
              path: `/repos/${owner}/${repo}/contents/${file.path}`,
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
                  resolve(JSON.parse(data));
                } else {
                  reject(new Error(`Failed to fetch ${file.path}: ${res.statusCode}`));
                }
              });
            });

            req.on("error", (error) => {
              reject(error);
            });

            req.end();
          });

          // Decode and save file
          const content = Buffer.from(fileContent.content, "base64").toString("utf-8");
          const localFilePath = path.join(syncedRepoPath, file.path);
          const baseRepoPath = path.join(getSyncedRepoBaseContentPath(owner, repo), branch);
          const baseFilePath = path.join(baseRepoPath, file.path);

          // Ensure directories exist
          [path.dirname(localFilePath), path.dirname(baseFilePath)].forEach(dir => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          });

          // SAFE OVERWRITE LOGIC:
          // Check if we should overwrite the local working copy.
          // We only overwrite if:
          // 1. Local file doesn't exist.
          // 2. Local file exists AND it matches our CURRENT base version (i.e. it's pristine).
          let shouldOverwriteLocal = !fs.existsSync(localFilePath);
          
          if (!shouldOverwriteLocal && fs.existsSync(baseFilePath)) {
            const currentLocalContent = fs.readFileSync(localFilePath, "utf-8").replace(/\r\n/g, "\n");
            const currentBaseContent = fs.readFileSync(baseFilePath, "utf-8").replace(/\r\n/g, "\n");
            
            if (currentLocalContent === currentBaseContent) {
              shouldOverwriteLocal = true;
            }
          }

          if (shouldOverwriteLocal) {
            fs.writeFileSync(localFilePath, content, "utf-8");
          }
          
          // ALWAYS update the base copy so diffs reflect remote HEAD
          fs.writeFileSync(baseFilePath, content, "utf-8");
          syncedCount++;

          console.log(`Synced: ${file.path} (${syncedCount}/${files.length})`);
        } catch (error) {
          console.error(`Failed to sync ${file.path}:`, error);
          failedCount++;
        }
      }

      return {
        success: true,
        syncedCount,
        failedCount,
        totalFiles: files.length,
      };
    } catch (error) {
      console.error("Failed to sync repository:", error);
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

// IPC handler for starting xyd dev server
ipcMain.handle(
  "xyd:start-server",
  async (_event, owner: string, repo: string) => {
    return new Promise((resolve) => {
      try {
        // Stop existing server if running
        if (xydServerProcess) {
          xydServerProcess.kill();
          xydServerProcess = null;
          xydServerPort = null;
        }

        // Get the synced repository path
        const repositoryPath = getSyncedRepoPath(owner, repo);

        console.log("repositoryPath", repositoryPath)
        // Start xyd dev server
        // Using bunx to ensure xyd-js is available
        xydServerProcess = spawn("bunx", ["xyd-js"], {
          cwd: repositoryPath,
          shell: true,
          env: { ...process.env },
          stdio: 'pipe'
        });

        let serverStarted = false;
        const timeout = setTimeout(() => {
          if (!serverStarted) {
            resolve({
              success: false,
              error: "Server startup timeout",
            });
          }
        }, 30000); // 30 second timeout

        const outputListener = (data: Buffer) => {
          const rawOutput = data.toString();
          console.log("XYD Server Output:", rawOutput);

          // Strip ANSI escape codes
          const output = rawOutput.replace(/\u001b\[[0-9;]*m/g, "");

          // Look for port in output (e.g. "Local: http://localhost:5175/")
          const portMatch = output.match(/localhost:(\d+)/i) || output.match(/port (\d+)/i);
          
          if (portMatch && !serverStarted) {
            xydServerPort = parseInt(portMatch[1], 10);
            serverStarted = true;
            clearTimeout(timeout);
            resolve({
              success: true,
              port: xydServerPort,
              url: `http://localhost:${xydServerPort}`,
            });
          } else if (
            (output.includes("ready") || output.includes("started")) && 
            !output.includes("instance") && 
            !serverStarted
          ) {
            // Fallback: assume default port if we can't parse it but see it's ready
            // Ignore "instance is ready" as it refers to a local tool instance, not the server
            xydServerPort = 3000;
            serverStarted = true;
            clearTimeout(timeout);
            resolve({
              success: true,
              port: xydServerPort,
              url: `http://localhost:${xydServerPort}`,
            });
          }
        };

        // Capture stdout and stderr to detect when server is ready
        xydServerProcess.stdout?.on("data", outputListener);
        xydServerProcess.stderr?.on("data", (data) => {
          console.error("XYD Server Error Stream:", data.toString());
          outputListener(data);
        });

        xydServerProcess.on("error", (error) => {
          console.error("Failed to start XYD server:", error);
          clearTimeout(timeout);
          if (!serverStarted) {
            resolve({
              success: false,
              error: error.message,
            });
          }
        });

        xydServerProcess.on("exit", (code) => {
          console.log("XYD server exited with code:", code);
          xydServerProcess = null;
          xydServerPort = null;
        });
      } catch (error) {
        console.error("Failed to start XYD server:", error);
        resolve({
          success: false,
          error: (error as Error).message,
        });
      }
    });
  }
);

// IPC handler for stopping xyd dev server
ipcMain.handle("xyd:stop-server", async () => {
  try {
    if (xydServerProcess) {
      xydServerProcess.kill();
      xydServerProcess = null;
      xydServerPort = null;
      return { success: true };
    }
    return { success: true, message: "No server running" };
  } catch (error) {
    console.error("Failed to stop XYD server:", error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC handler for getting server status
ipcMain.handle("xyd:get-server-status", async () => {
  return {
    success: true,
    running: xydServerProcess !== null,
    port: xydServerPort,
    url: xydServerPort ? `http://localhost:${xydServerPort}` : null,
  };
});


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
