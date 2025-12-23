import { app, screen, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { spawn, ChildProcess } from "node:child_process";
import ignore from "ignore";
import fixPath from "fix-path";

// ES module equivalent of __dirname
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";
import type { Ignore } from "ignore";


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import started from "electron-squirrel-startup";
if (started) {
  app.quit();
}

// Fix the PATH for production builds on macOS to find 'bun' and other tools
fixPath();

// XYD dev server management
let xydServerProcess: ChildProcess | null = null;
let xydServerPort: number | null = null;
let xydServerRepo: { owner: string; repo: string } | null = null;

// Path to store encrypted token and connected repositories
const TOKEN_FILE_PATH = path.join(app.getPath("userData"), "github-token.enc");
const FALLBACK_TOKEN_FILE_PATH = path.join(app.getPath("userData"), "github-token.aes");
const FALLBACK_KEY_FILE_PATH = path.join(app.getPath("userData"), "xyd.key");
const REPOSITORIES_FILE_PATH = path.join(
  app.getPath("userData"),
  "connected-repositories.json"
);
const IGNORE_NAMES = [".git", "node_modules", ".DS_Store", ".xyd", ".vite", ".next", ".cache", "__pycache__"];

// Helper to get or create a persistent encryption key for fallback
function getFallbackKey(): Buffer {
  if (!fs.existsSync(FALLBACK_KEY_FILE_PATH)) {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(FALLBACK_KEY_FILE_PATH, key);
    return key;
  }
  return fs.readFileSync(FALLBACK_KEY_FILE_PATH);
}

function encryptFallback(text: string): Buffer {
  const key = getFallbackKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Return IV + TAG + DATA
  return Buffer.concat([iv, tag, encrypted]);
}

function decryptFallback(buffer: Buffer): string {
  const key = getFallbackKey();
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

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

// Shared ignore builder (local names + .gitignore)
function buildIgnoreMatcher(root: string): Ignore {
  const ig = ignore();
  const gitignorePath = path.join(root, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    try {
      ig.add(fs.readFileSync(gitignorePath, "utf-8"));
    } catch (e) {
      console.error("Failed to parse .gitignore:", e);
    }
  }
  // Ensure always ignoring base names
  ig.add(IGNORE_NAMES.map((name) => name + "/**"));
  return ig;
}

function isIgnoredPath(relativePath: string, ig: Ignore): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  if (IGNORE_NAMES.some((name) => normalized === name || normalized.startsWith(name + "/"))) return true;
  if (normalized.split("/").some((part) => IGNORE_NAMES.includes(part))) return true;
  return ig.ignores(normalized);
}

// ...

// IPC handlers for GitHub token management
// Helper to get the GitHub token, trying safeStorage first, then fallback.
function getGitHubToken(): string | null {
  try {
    // Check safeStorage first
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedToken = fs.readFileSync(TOKEN_FILE_PATH);
        return safeStorage.decryptString(encryptedToken);
      }
    }

    // Check fallback next
    if (fs.existsSync(FALLBACK_TOKEN_FILE_PATH)) {
      const encrypted = fs.readFileSync(FALLBACK_TOKEN_FILE_PATH);
      return decryptFallback(encrypted);
    }

    return null;
  } catch (error) {
    console.error("Error retrieving GitHub token:", error);
    return null;
  }
}

// IPC handlers for GitHub token management
ipcMain.handle("github-token:save", async (_event, token: string) => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encryptedToken = safeStorage.encryptString(token);
      fs.writeFileSync(TOKEN_FILE_PATH, encryptedToken);
      if (fs.existsSync(FALLBACK_TOKEN_FILE_PATH)) fs.unlinkSync(FALLBACK_TOKEN_FILE_PATH);
    } else {
      console.warn("safeStorage not available, using AES fallback");
      const encrypted = encryptFallback(token);
      fs.writeFileSync(FALLBACK_TOKEN_FILE_PATH, encrypted);
      if (fs.existsSync(TOKEN_FILE_PATH)) fs.unlinkSync(TOKEN_FILE_PATH);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to save GitHub token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("github-token:get", async () => {
  const token = getGitHubToken();
  return { success: true, token };
});

ipcMain.handle("github-token:delete", async () => {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) fs.unlinkSync(TOKEN_FILE_PATH);
    if (fs.existsSync(FALLBACK_TOKEN_FILE_PATH)) fs.unlinkSync(FALLBACK_TOKEN_FILE_PATH);
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

/**
 * Generalized GitHub API request helper.
 */
async function githubRequest(options: {
  path: string;
  method?: string;
  body?: any;
}): Promise<any> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error("No GitHub token configured");
  }

  const https = await import("https");
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: "api.github.com",
      path: options.path,
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Electron-App",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : { success: true });
          } else {
            const error = data ? JSON.parse(data).message : `HTTP ${res.statusCode}`;
            reject(new Error(error));
          }
        } catch (e) {
          reject(new Error("Failed to parse GitHub API response"));
        }
      });
    });

    req.on("error", (error) => reject(error));
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// IPC handlers for GitHub API operations
ipcMain.handle(
  "github:get-branches",
  async (_event, owner: string, repo: string) => {
    try {
      const branches: any[] = await githubRequest({
        path: `/repos/${owner}/${repo}/branches`,
      });
      return { success: true, branches: branches.map((b: any) => b.name) };
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle(
  "github:get-tree",
  async (_event, owner: string, repo: string, branch: string) => {
    try {
      const data = await githubRequest({
        path: `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      });
      return { success: true, data };
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

      // Fetch file content from GitHub API
      const fileData: any = await githubRequest({
        path: `/repos/${owner}/${repo}/contents/${filePath}`,
      });

      // Decode base64 content
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");

      // Save to local synced storage
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localFilePath, content, "utf-8");

      return { success: true, content, fromLocal: false };
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
        return { success: false, error: "Missing required arguments" };
      }

      const baseRepoPath = getSyncedRepoBaseContentPath(owner, repo);
      const baseFilePath = path.join(baseRepoPath, branch, filePath);

      // If we have it cached locally in the base path, return it
      if (fs.existsSync(baseFilePath)) {
        const content = fs.readFileSync(baseFilePath, "utf-8");
        return { success: true, content };
      }

      // Otherwise, fetch from GitHub API
      const fileData: any = await githubRequest({
        path: `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      });

      const content = Buffer.from(fileData.content, "base64").toString("utf-8");

      // Cache in the base path
      const dir = path.dirname(baseFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(baseFilePath, content, "utf-8");

      return { success: true, content };
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
      const ig = buildIgnoreMatcher(syncedRepoPath);

      const scanDirectory = (currentDir: string, relativePath: string = "") => {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
          if (isIgnoredPath(itemRelativePath, ig)) continue;

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
              // Only compare if they are likely text files to avoid binary diff issues
              const ext = path.extname(item).toLowerCase();
              const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.exe', '.dll', '.so', '.dylib'];
              if (binaryExts.includes(ext)) continue;

              const currentContent = fs.readFileSync(fullPath, "utf-8").replace(/\r\n/g, "\n");
              const baseContent = fs.readFileSync(baseFilePath, "utf-8").replace(/\r\n/g, "\n");

              if (currentContent !== baseContent) {
                modifiedFiles.push(normalizedRelativePath);
              }
            } else {
              // If it's a new file not in the base tree, it's modified (added)
              // But only if it's not a common system/hidden file we missed
              if (!item.startsWith('.')) {
                modifiedFiles.push(normalizedRelativePath);
              }
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

// IPC handler for publishing changes (commit & push)
ipcMain.handle(
  "github:publish-changes",
  async (_event, owner: string, repo: string, branch: string, message: string) => {
    try {
      if (!owner || !repo || !branch || !message) {
        return { success: false, error: "Missing required arguments" };
      }

      const syncedRepoPath = getSyncedRepoPath(owner, repo);
      const ig = buildIgnoreMatcher(syncedRepoPath);

      // 1. Identify modified files
      // We'll reimplement a simplified scan here to get the actual file paths and content references
      const modifiedFiles: { path: string; fullPath: string }[] = [];
      const baseRepoPath = path.join(getSyncedRepoBaseContentPath(owner, repo), branch);

      const scanDirectory = (currentDir: string, relativePath: string = "") => {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
          const itemRelativePath = path.join(relativePath, item);
          const normalizedRelativePath = itemRelativePath.split(path.sep).join("/");
          if (isIgnoredPath(normalizedRelativePath, ig)) continue;

          const fullPath = path.join(currentDir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            scanDirectory(fullPath, itemRelativePath);
          } else if (stats.isFile()) {
            const baseFilePath = path.join(baseRepoPath, itemRelativePath);
            
            // Check if modified
            if (fs.existsSync(baseFilePath)) {
              // Binary check
              const ext = path.extname(item).toLowerCase();
              const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.exe', '.dll', '.so', '.dylib'];
              if (binaryExts.includes(ext)) {
                continue; 
              }

              const currentContent = fs.readFileSync(fullPath, "utf-8").replace(/\r\n/g, "\n");
              const baseContent = fs.readFileSync(baseFilePath, "utf-8").replace(/\r\n/g, "\n");
              if (currentContent !== baseContent) {
                modifiedFiles.push({ path: normalizedRelativePath, fullPath });
              }
            } else {
              // New file
              if (!item.startsWith('.')) {
                modifiedFiles.push({ path: normalizedRelativePath, fullPath });
              }
            }
          }
        }
      };

      if (fs.existsSync(syncedRepoPath)) {
          scanDirectory(syncedRepoPath);
      }

      if (modifiedFiles.length === 0) {
        return { success: true, message: "No changes to publish" };
      }

      // 2. Get latest commit SHA
      const refData: any = await githubRequest({
        path: `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      });
      const latestCommitSha = refData.object.sha;

      // 3. Get base tree SHA
      const commitData: any = await githubRequest({
        path: `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      });
      const baseTreeSha = commitData.tree.sha;

      // 4. Create blobs for each modified file
      const treeItems = [];
      for (const file of modifiedFiles) {
        const content = fs.readFileSync(file.fullPath, "utf-8");
        const blobData: any = await githubRequest({
          method: "POST",
          path: `/repos/${owner}/${repo}/git/blobs`,
          body: {
            content: content,
            encoding: "utf-8",
          },
        });
        
        treeItems.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        });
      }

      // 5. Create new tree
      const newTreeData: any = await githubRequest({
        method: "POST",
        path: `/repos/${owner}/${repo}/git/trees`,
        body: {
          base_tree: baseTreeSha,
          tree: treeItems,
        },
      });
      const newTreeSha = newTreeData.sha;

      // 6. Create commit
      const newCommitData: any = await githubRequest({
        method: "POST",
        path: `/repos/${owner}/${repo}/git/commits`,
        body: {
          message: message,
          tree: newTreeSha,
          parents: [latestCommitSha],
        },
      });
      const newCommitSha = newCommitData.sha;

      // 7. Update ref
      await githubRequest({
        method: "PATCH",
        path: `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        body: {
          sha: newCommitSha,
        },
      });

      // Update the base files to match the new state so diffs are cleared
       for (const file of modifiedFiles) {
          const content = fs.readFileSync(file.fullPath, "utf-8"); // Raw read (no CRLF logic needed for copy)
          const baseFilePath = path.join(baseRepoPath, file.path);
          // Ensure dir
          const dir = path.dirname(baseFilePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(baseFilePath, content, "utf-8");
       }

      return { success: true, commitSha: newCommitSha };
    } catch (error) {
      console.error("Failed to publish changes:", error);
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
      // First, get the repository tree
      const treeData: any = await githubRequest({
        path: `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      });

      // Filter for blob (file) entries only
      const files = treeData.tree.filter((item: any) => item.type === "blob");
      const syncedRepoPath = getSyncedRepoPath(owner, repo);
      const ig = buildIgnoreMatcher(syncedRepoPath);

      let syncedCount = 0;
      let failedCount = 0;

      // Download each file
      for (const file of files) {
        try {
          if (isIgnoredPath(file.path, ig)) continue;

          // Fetch file content using our helper (this also handles the token/encryption fallback)
          const fileContent: any = await githubRequest({
            path: `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
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
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    show: true, // Don't show until ready
    icon: path.join(__dirname, "../../assets/logo.png"),
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
      const commits = await githubRequest({
        path: `/repos/${owner}/${repo}/commits?per_page=${limit}`,
      });
      return { success: true, commits };
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
        // Stop existing server if running for a different repo
        if (xydServerProcess) {
          xydServerProcess.kill();
          xydServerProcess = null;
          xydServerPort = null;
          xydServerRepo = null;
        }

        // Get the synced repository path
        const repositoryPath = getSyncedRepoPath(owner, repo);

        console.log("Starting XYD server...");
        console.log("Repository Path:", repositoryPath);
        console.log("Current PATH:", process.env.PATH);
        
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
              owner,
              repo,
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
              owner,
              repo,
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
          xydServerRepo = null;
        });

        xydServerRepo = { owner, repo };
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
      xydServerRepo = null;
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
    owner: xydServerRepo?.owner ?? null,
    repo: xydServerRepo?.repo ?? null,
  };
});




// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
