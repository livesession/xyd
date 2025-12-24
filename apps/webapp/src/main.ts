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

// Set up error logging to help debug initialization issues
const logError = (message: string, error?: any) => {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.error(logMessage);
  if (error) {
    console.error(error);
    if (error.stack) console.error('Stack:', error.stack);
  }

  // Write to log file after app is ready
  if (app.isReady()) {
    try {
      const logDir = app.getPath('userData');
      const logFile = path.join(logDir, 'error.log');
      const fullMessage = error ? `${logMessage}\n${JSON.stringify(error, null, 2)}\n${error.stack || ''}\n\n` : `${logMessage}\n\n`;
      fs.appendFileSync(logFile, fullMessage);
    } catch (e) {
      console.error('Failed to write to log file:', e);
    }
  }
};

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled Rejection', reason);
});

// Log when app is ready
app.on('ready', () => {
  console.log('App is ready');
  console.log('User data path:', app.getPath('userData'));
  const logFile = path.join(app.getPath('userData'), 'error.log');
  console.log('Error log file:', logFile);
});

// XYD dev server management
let xydServerProcess: ChildProcess | null = null;
let xydServerPort: number | null = null;
let xydServerRepo: { owner: string; repo: string } | null = null;

// Path to store encrypted token and connected repositories
// Note: These are functions to ensure app.getPath() is called after app is ready
const getTokenFilePath = () => {
  if (!app.isReady()) {
    throw new Error('Cannot get token file path: app is not ready yet');
  }
  return path.join(app.getPath("userData"), "github-token.enc");
};
const getFallbackTokenFilePath = () => {
  if (!app.isReady()) {
    throw new Error('Cannot get fallback token file path: app is not ready yet');
  }
  return path.join(app.getPath("userData"), "github-token.aes");
};
const getFallbackKeyFilePath = () => {
  if (!app.isReady()) {
    throw new Error('Cannot get fallback key file path: app is not ready yet');
  }
  return path.join(app.getPath("userData"), "xyd.key");
};
const getRepositoriesFilePath = () => {
  if (!app.isReady()) {
    throw new Error('Cannot get repositories file path: app is not ready yet');
  }
  return path.join(app.getPath("userData"), "connected-repositories.json");
};
const IGNORE_NAMES = [".git", "node_modules", ".DS_Store", ".xyd", ".vite", ".next", ".cache", "__pycache__", "dist"];

// Helper to get or create a persistent encryption key for fallback
function getFallbackKey(): Buffer {
  const fallbackKeyPath = getFallbackKeyFilePath();
  if (!fs.existsSync(fallbackKeyPath)) {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(fallbackKeyPath, key);
    return key;
  }
  return fs.readFileSync(fallbackKeyPath);
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
    const tokenPath = getTokenFilePath();
    const fallbackTokenPath = getFallbackTokenFilePath();

    // Check safeStorage first
    if (fs.existsSync(tokenPath)) {
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedToken = fs.readFileSync(tokenPath);
        return safeStorage.decryptString(encryptedToken);
      }
    }

    // Check fallback next
    if (fs.existsSync(fallbackTokenPath)) {
      const encrypted = fs.readFileSync(fallbackTokenPath);
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
    const tokenPath = getTokenFilePath();
    const fallbackTokenPath = getFallbackTokenFilePath();

    if (safeStorage.isEncryptionAvailable()) {
      const encryptedToken = safeStorage.encryptString(token);
      fs.writeFileSync(tokenPath, encryptedToken);
      if (fs.existsSync(fallbackTokenPath)) fs.unlinkSync(fallbackTokenPath);
    } else {
      console.warn("safeStorage not available, using AES fallback");
      const encrypted = encryptFallback(token);
      fs.writeFileSync(fallbackTokenPath, encrypted);
      if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
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
    const tokenPath = getTokenFilePath();
    const fallbackTokenPath = getFallbackTokenFilePath();

    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
    if (fs.existsSync(fallbackTokenPath)) fs.unlinkSync(fallbackTokenPath);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete GitHub token:", error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC handlers for repository management
ipcMain.handle("repositories:get-connected", async () => {
  try {
    const reposFilePath = getRepositoriesFilePath();
    if (!fs.existsSync(reposFilePath)) {
      return { success: true, repositories: [] };
    }

    const data = fs.readFileSync(reposFilePath, "utf-8");
    const repositories = JSON.parse(data);
    return { success: true, repositories };
  } catch (error) {
    console.error("Failed to get connected repositories:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("repositories:connect", async (_event, repository) => {
  try {
    const reposFilePath = getRepositoriesFilePath();
    let repositories = [];

    if (fs.existsSync(reposFilePath)) {
      const data = fs.readFileSync(reposFilePath, "utf-8");
      repositories = JSON.parse(data);
    }

    // Check if repository is already connected
    const exists = repositories.find((r: any) => r.id === repository.id);
    if (!exists) {
      repositories.push(repository);
      fs.writeFileSync(
        reposFilePath,
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
      const reposFilePath = getRepositoriesFilePath();
      if (!fs.existsSync(reposFilePath)) {
        return { success: true, repositories: [] };
      }

      const data = fs.readFileSync(reposFilePath, "utf-8");
      let repositories = JSON.parse(data);

      repositories = repositories.filter((r: any) => r.id !== repositoryId);
      fs.writeFileSync(
        reposFilePath,
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
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => { chunks.push(Buffer.from(chunk)); });
      res.on("end", () => {
        try {
          const data = Buffer.concat(chunks).toString("utf-8");
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

      // For large files, use blob API
      let content: string;
      if (fileData.size > 1000000 || !fileData.content) {
        const blobData: any = await githubRequest({
          path: `/repos/${owner}/${repo}/git/blobs/${fileData.sha}`,
        });
        content = Buffer.from(blobData.content, "base64").toString("utf-8");
      } else {
        // Decode base64 content
        content = Buffer.from(fileData.content, "base64").toString("utf-8");
      }

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

      // Handle large files
      let content: string;
      if (fileData.size > 1000000 || !fileData.content) {
        const blobData: any = await githubRequest({
          path: `/repos/${owner}/${repo}/git/blobs/${fileData.sha}`,
        });
        content = Buffer.from(blobData.content, "base64").toString("utf-8");
      } else {
        content = Buffer.from(fileData.content, "base64").toString("utf-8");
      }

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
          const itemRelativePath = path.join(relativePath, item);
          if (isIgnoredPath(itemRelativePath, ig)) continue;

          const fullPath = path.join(currentDir, item);
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

          // For large files (>1MB), GitHub Contents API doesn't include content
          // We need to use the blob API directly with the SHA
          let content: string;

          if (file.size > 1000000) {
            // Use Git Blob API for large files
            const blobData: any = await githubRequest({
              path: `/repos/${owner}/${repo}/git/blobs/${file.sha}`,
            });
            content = Buffer.from(blobData.content, "base64").toString("utf-8");
          } else {
            // Use Contents API for smaller files
            const fileContent: any = await githubRequest({
              path: `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
            });

            if (!fileContent.content) {
              console.warn(`No content for ${file.path}, skipping...`);
              continue;
            }

            content = Buffer.from(fileContent.content, "base64").toString("utf-8");
          }
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
    fullscreen: true,
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
        
        // In your app's resources, include xyd as a dependency
        // const xydPath = path.join(process.resourcesPath, 'node_modules', 'xyd-js', 'index.js');
        // // // Start xyd dev server

        // xydServerProcess = spawn("node", [xydPath], {
        //   cwd: repositoryPath,
        //   shell: true,
        //   env: { ...process.env },
        //   stdio: 'pipe'
        // });

        const isDev = !app.isPackaged;

        let xydPath: string;
        let nodeExecutable: string;
        let nodeArgs: string[];
        let spawnEnv: NodeJS.ProcessEnv;

        if (isDev) {
          // Development: path relative to app directory
          const appPath = app.getAppPath();
          xydPath = path.join(appPath, 'node_modules', 'xyd-js', 'index.js');

          // Use system node in development too
          nodeExecutable = 'node';
          nodeArgs = [xydPath];
          spawnEnv = { ...process.env };
        } else {
          // Production: Check multiple possible locations for xyd-js
          const resourcesPath = process.resourcesPath;

          const possiblePaths = [
            // extraResource location (most likely with our config)
            path.join(resourcesPath, 'xyd-js', 'index.js'),
          ];

          // Find the first path that exists
          xydPath = possiblePaths.find(p => {
            try {
              const exists = fs.existsSync(p);
              return exists;
            } catch (error) {
              console.error(`Error checking path ${p}:`, error);
              return false;
            }
          }) || '';

          if (!xydPath) {
            console.error('Could not find xyd-js in any expected location. Tried:', possiblePaths);
            resolve({
              success: false,
              error: 'xyd-js not found in packaged app. Please ensure it is properly bundled.',
            });
            return;
          }

          nodeExecutable = 'node';
          nodeArgs = [xydPath];
          spawnEnv = { ...process.env };
        }

        console.log('Starting xyd server with:', { nodeExecutable, nodeArgs, xydPath, isDev });

        xydServerProcess = spawn(nodeExecutable, nodeArgs, {
          cwd: repositoryPath,
          shell: true,
          env: spawnEnv,
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




// IPC handler for OpenVSX API proxy (to avoid CORS)
ipcMain.handle("openvsx:fetch", async (_event, url: string) => {
  try {
    console.log("Fetching from OpenVSX:", url);
    const response = await fetch(url);

    console.log("OpenVSX response status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenVSX error response:", text.substring(0, 200));
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");

    // Check if response is actually JSON
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("OpenVSX returned non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        status: response.status,
        error: "Response is not JSON",
      };
    }

    const data = await response.json();

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("OpenVSX fetch error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

// IPC handler for fetching and compiling OpenVSX README
ipcMain.handle(
  "openvsx:fetch-and-compile-readme",
  async (_event, namespace: string, extensionName: string, version: string) => {
    try {
      // Construct the README URL
      const readmeUrl = `https://open-vsx.org/api/${namespace}/${extensionName}/${version}/file/README.md`;
      console.log("Fetching OpenVSX README:", readmeUrl);

      // Fetch the README markdown
      const response = await fetch(readmeUrl);

      if (!response.ok) {
        console.error("Failed to fetch README:", response.status, response.statusText);
        return {
          success: false,
          error: `Failed to fetch README: HTTP ${response.status}`,
        };
      }

      const markdown = await response.text();

      // Compile the markdown using the same logic as editor:compile-markdown
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
        "README.md"
      );

      return {
        success: true,
        compiledContent,
      };
    } catch (error) {
      console.error("Failed to fetch and compile README:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
