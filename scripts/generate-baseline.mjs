#!/usr/bin/env node
/**
 * Generate Node.js support baseline badge based on test results
 * 
 * Usage:
 *   node scripts/generate-baseline.mjs <test-results-file>
 * 
 * The script will:
 * 1. Parse test results from the file
 * 2. Generate baseline URL
 * 3. Download the image
 * 4. Upload to GitHub release
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const TEST_RESULTS_FILE = process.argv[2] || 'test-results.json';
const TOKEN = process.env.GITHUB_TOKEN;
const VERSION = process.env.VERSION || '';

if (!TOKEN) {
  console.error('❌ Set GITHUB_TOKEN');
  process.exit(1);
}

if (!VERSION) {
  console.error('❌ Set VERSION environment variable');
  process.exit(1);
}

// The test results are already in baseline format, just return them
function parseTestResults(results) {
  return results;
}

// Generate baseline URL
function generateBaselineUrl(toolGroups) {
  const baseUrl = 'https://basely-432902314303.us-central1.run.app/baseline.png';
  const params = new URLSearchParams({
    title: 'Node.js Support',
    width: '1024',
    toolGroups: JSON.stringify(toolGroups)
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Download image
async function downloadImage(url, filename) {
  console.log(`📥 Downloading baseline image from: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  writeFileSync(filename, Buffer.from(buffer));
  console.log(`✅ Downloaded baseline image to: ${filename}`);
}

// Upload to GitHub release
async function uploadToRelease(filename, releaseId) {
  console.log(`📤 Uploading ${filename} to GitHub release ${releaseId}`);
  
  const { owner, repo } = getRepoInfo();
  const fileBuffer = readFileSync(filename);
  
  const response = await fetch(
    `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${filename}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'image/png',
        'Content-Length': fileBuffer.length.toString()
      },
      body: fileBuffer
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload asset: ${response.status} ${response.statusText} - ${error}`);
  }
  
  const result = await response.json();
  console.log(`✅ Uploaded baseline image: ${result.browser_download_url}`);
  return result.browser_download_url;
}

// Get repository info
function getRepoInfo() {
  const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  const ssh = remote.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  const https = remote.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  
  if (ssh) {
    return { owner: ssh[1], repo: ssh[2] };
  } else if (https) {
    return { owner: https[1], repo: https[2] };
  } else {
    throw new Error(`Not a GitHub remote: ${remote}`);
  }
}

// Get release ID by tag
async function getReleaseId(tag) {
  const { owner, repo } = getRepoInfo();
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get release: ${response.status} ${response.statusText}`);
  }
  
  const release = await response.json();
  return release.id;
}

// Update README.md with baseline image link
function updateReadme(baselineUrl) {
  const readmePath = 'README.md';
  let readmeContent = readFileSync(readmePath, 'utf8');
  
  // Look for existing baseline image section
  const baselinePattern = /## Node\.js Support[\s\S]*?(!\[Node\.js Support\]\([^)]+\))/;
  const newBaselineSection = `## Node.js Support

![Node.js Support](${baselineUrl})`;
  
  if (baselinePattern.test(readmeContent)) {
    // Replace existing section
    readmeContent = readmeContent.replace(baselinePattern, newBaselineSection);
  } else {
    // Add new section after the first heading
    const firstHeadingIndex = readmeContent.indexOf('# ');
    if (firstHeadingIndex !== -1) {
      const nextHeadingIndex = readmeContent.indexOf('\n## ', firstHeadingIndex);
      const insertIndex = nextHeadingIndex !== -1 ? nextHeadingIndex : readmeContent.length;
      
      readmeContent = readmeContent.slice(0, insertIndex) + 
                     '\n\n' + newBaselineSection + '\n' + 
                     readmeContent.slice(insertIndex);
    }
  }
  
  writeFileSync(readmePath, readmeContent);
  console.log('✅ Updated README.md with baseline image');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Generating Node.js support baseline...');
    
    // Read test results
    let testResults;
    try {
      const resultsContent = readFileSync(TEST_RESULTS_FILE, 'utf8');
      testResults = JSON.parse(resultsContent);
    } catch (error) {
      console.error(`❌ Failed to read test results from ${TEST_RESULTS_FILE}:`, error.message);
      process.exit(1);
    }
    
    // The test results are already in baseline format
    console.log('📊 Baseline data loaded:', JSON.stringify(testResults, null, 2));
    const toolGroups = parseTestResults(testResults);
    
    // Generate baseline URL
    const baselineUrl = generateBaselineUrl(toolGroups);
    console.log('🔗 Generated baseline URL:', baselineUrl);
    
    // Download the image
    const filename = `node-support-baseline-${VERSION}.png`;
    await downloadImage(baselineUrl, filename);
    
    // Upload to GitHub release
    const tag = `v${VERSION}`;
    const releaseId = await getReleaseId(tag);
    await uploadToRelease(filename, releaseId);
    
    // Update README.md
    // updateReadme(uploadedUrl);
    
    console.log('🎉 Baseline generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to generate baseline:', error.message);
    process.exit(1);
  }
}

main();
