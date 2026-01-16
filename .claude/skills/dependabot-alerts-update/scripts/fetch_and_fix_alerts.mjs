#!/usr/bin/env node
/**
 * Fetch Dependabot alerts from GitHub and update vulnerable packages.
 *
 * Usage:
 *   node fetch_and_fix_alerts.mjs [--owner OWNER] [--repo REPO] [--token TOKEN] [--dry-run]
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdirSync, statSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    owner: null,
    repo: null,
    token: process.env.GITHUB_TOKEN || null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--owner":
        options.owner = args[++i];
        break;
      case "--repo":
        options.repo = args[++i];
        break;
      case "--token":
        options.token = args[++i];
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
        console.log(`
Usage: node fetch_and_fix_alerts.mjs [options]

Options:
  --owner OWNER    Repository owner
  --repo REPO      Repository name
  --token TOKEN    GitHub token (or set GITHUB_TOKEN env var)
  --dry-run        Show changes without applying
  --help           Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

function getRepoInfo() {
  try {
    const url = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    
    // Handle both HTTPS and SSH URLs
    if (url.startsWith("git@")) {
      // SSH: git@github.com:owner/repo.git
      const match = url.match(/git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    } else {
      // HTTPS: https://github.com/owner/repo.git
      const match = url.match(/github\.com[/:](.+?)\/(.+?)(?:\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(".git", "") };
      }
    }
    
    throw new Error(`Could not parse git remote URL: ${url}`);
  } catch (error) {
    throw new Error("Not a git repository or no origin remote found");
  }
}

async function fetchDependabotAlerts(owner, repo, token) {
  const alerts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=${perPage}&page=${page}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const pageAlerts = await response.json();
    if (!pageAlerts || pageAlerts.length === 0) {
      break;
    }

    alerts.push(...pageAlerts);

    // Check if there are more pages
    const linkHeader = response.headers.get("link");
    if (!linkHeader || !linkHeader.includes('rel="next"')) {
      break;
    }
    page++;
  }

  return alerts;
}

function parseAlert(alert) {
  const dependency = alert.dependency || {};
  const securityAdvisory = alert.security_advisory || {};
  const securityVulnerability = alert.security_vulnerability || {};
  const packageInfo = dependency.package || {};

  return {
    number: alert.number,
    packageName: packageInfo.name,
    ecosystem: packageInfo.ecosystem,
    manifestPath: dependency.manifest_path,
    severity: securityAdvisory.severity,
    ghsaId: securityAdvisory.ghsa_id,
    cveId: securityAdvisory.cve_id,
    summary: securityAdvisory.summary,
    vulnerableVersionRange: securityVulnerability.vulnerable_version_range,
    firstPatchedVersion: securityVulnerability.first_patched_version,
  };
}

function findPackageJsonFiles(rootDir = ".") {
  const packageJsons = [];
  
  function walkDir(dir) {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        
        // Skip node_modules and .git directories
        if (entry === "node_modules" || entry === ".git") {
          continue;
        }
        
        try {
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (entry === "package.json") {
            packageJsons.push(fullPath);
          }
        } catch (err) {
          // Skip files/dirs we can't access
        }
      }
    } catch (err) {
      // Skip directories we can't access
    }
  }
  
  walkDir(rootDir);
  return packageJsons;
}

function findPackageInJson(packageJsonPath, packageName) {
  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    const data = JSON.parse(content);
    
    // Check all dependency sections
    for (const depsKey of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      if (data[depsKey] && data[depsKey][packageName]) {
        return {
          version: data[depsKey][packageName],
          section: depsKey,
        };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function updatePackageVersion(packageJsonPath, packageName, secureVersion, dryRun = false) {
  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    const data = JSON.parse(content);
    
    let updated = false;
    
    // Update in all dependency sections
    for (const depsKey of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      if (data[depsKey] && data[depsKey][packageName]) {
        const oldVersion = data[depsKey][packageName];
        
        // Preserve version prefix (^, ~, etc.) if secureVersion doesn't have one
        let finalVersion = secureVersion;
        if (!/^[\^~><=]/.test(secureVersion)) {
          // Preserve prefix from old version if it exists
          const prefixMatch = oldVersion.match(/^([\^~])/);
          if (prefixMatch) {
            finalVersion = prefixMatch[1] + secureVersion;
          } else {
            finalVersion = "^" + secureVersion;
          }
        }
        
        if (oldVersion !== finalVersion) {
          if (!dryRun) {
            data[depsKey][packageName] = finalVersion;
          }
          console.log(`  ${packageJsonPath}: ${packageName} ${oldVersion} → ${finalVersion}`);
          updated = true;
        }
      }
    }
    
    if (updated && !dryRun) {
      writeFileSync(packageJsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    }
    
    return updated;
  } catch (error) {
    console.error(`  Error updating ${packageJsonPath}: ${error.message}`);
    return false;
  }
}

function determineSecureVersion(alertInfo, currentVersion) {
  // Use first_patched_version if available
  if (alertInfo.firstPatchedVersion) {
    return alertInfo.firstPatchedVersion;
  }
  
  // Extract version from currentVersion (remove ^, ~, etc.)
  const versionMatch = currentVersion.match(/[\d.]+/);
  if (!versionMatch) {
    return null;
  }
  
  // For now, return null to indicate manual research needed
  // In a full implementation, you'd search security advisories
  return null;
}

async function main() {
  const options = parseArgs();
  
  if (!options.token) {
    console.error("Error: GitHub token required. Set GITHUB_TOKEN or use --token");
    process.exit(1);
  }
  
  // Get repo info
  let owner, repo;
  if (options.owner && options.repo) {
    owner = options.owner;
    repo = options.repo;
  } else {
    try {
      const repoInfo = getRepoInfo();
      owner = repoInfo.owner;
      repo = repoInfo.repo;
      console.log(`Detected repository: ${owner}/${repo}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      console.error("Please specify --owner and --repo");
      process.exit(1);
    }
  }
  
  // Fetch alerts
  console.log(`Fetching Dependabot alerts for ${owner}/${repo}...`);
  let alerts;
  try {
    alerts = await fetchDependabotAlerts(owner, repo, options.token);
    console.log(`Found ${alerts.length} open alerts`);
  } catch (error) {
    console.error(`Error fetching alerts: ${error.message}`);
    process.exit(1);
  }
  
  if (alerts.length === 0) {
    console.log("No open alerts found");
    return;
  }
  
  // Parse alerts
  const alertInfoList = alerts.map(parseAlert);
  
  // Group by package name
  const packagesByName = {};
  for (const info of alertInfoList) {
    const pkgName = info.packageName;
    if (pkgName) {
      if (!packagesByName[pkgName]) {
        packagesByName[pkgName] = [];
      }
      packagesByName[pkgName].push(info);
    }
  }
  
  // Find package.json files
  const packageJsonFiles = findPackageJsonFiles(".");
  console.log(`\nFound ${packageJsonFiles.length} package.json files`);
  
  // Update packages
  console.log("\nUpdating packages...");
  const updatesMade = [];
  
  for (const [packageName, alertsForPackage] of Object.entries(packagesByName)) {
    // Get highest severity alert
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    const primaryAlert = alertsForPackage.reduce((min, current) => {
      const currentSeverity = severityOrder[current.severity] ?? 99;
      const minSeverity = severityOrder[min.severity] ?? 99;
      return currentSeverity < minSeverity ? current : min;
    });
    
    console.log(`\n${packageName} (${primaryAlert.severity}):`);
    console.log(`  CVE/GHSA: ${primaryAlert.cveId || primaryAlert.ghsaId || "N/A"}`);
    console.log(`  Summary: ${primaryAlert.summary || "N/A"}`);
    
    // Find package in package.json files
    let found = false;
    for (const pkgJson of packageJsonFiles) {
      const result = findPackageInJson(pkgJson, packageName);
      if (result) {
        found = true;
        const { version: currentVersion } = result;
        
        // Determine secure version
        const secureVersion = determineSecureVersion(primaryAlert, currentVersion);
        
        if (secureVersion) {
          if (updatePackageVersion(pkgJson, packageName, secureVersion, options.dryRun)) {
            updatesMade.push({
              package: packageName,
              file: pkgJson,
              old: currentVersion,
              new: secureVersion,
            });
          }
        } else {
          console.log(`  ${pkgJson}: ${currentVersion} (secure version needs research)`);
        }
      }
    }
    
    if (!found) {
      console.log(`  Not found in package.json (likely transitive dependency)`);
    }
  }
  
  // Summary
  console.log(`\n${options.dryRun ? "Dry run: " : ""}Summary:`);
  console.log(`  Packages checked: ${Object.keys(packagesByName).length}`);
  console.log(`  Updates made: ${updatesMade.length}`);
  
  if (updatesMade.length > 0) {
    console.log("\nUpdated packages:");
    for (const update of updatesMade) {
      console.log(`  ${update.package}: ${update.old} → ${update.new} in ${update.file}`);
    }
  }
  
  if (!options.dryRun && updatesMade.length > 0) {
    console.log("\nNext steps:");
    console.log("  1. Run: pnpm install (or npm install / yarn install)");
    console.log("  2. Run: pnpm audit (or npm audit / yarn audit)");
    console.log("  3. Test your application: pnpm run build");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
