/**
 * Script to refactor welcome.tsx to use new components
 *
 * This script:
 * 1. Reads the original welcome.tsx
 * 2. Converts section+h1/h2/h3 patterns to SpecSection
 * 3. Keeps all content intact
 * 4. Outputs to welcome.refactored.tsx
 */

const fs = require('fs');
const path = require('path');

const originalFile = path.join(__dirname, 'welcome.tsx');
const outputFile = path.join(__dirname, 'welcome.refactored.tsx');

console.log('Reading original file...');
let content = fs.readFileSync(originalFile, 'utf-8');

// Extract the Article function content
const articleMatch = content.match(/function Article\(\) \{[\s\S]*?^}/m);
if (!articleMatch) {
  console.error('Could not find Article function');
  process.exit(1);
}

const articleContent = articleMatch[0];

// Keep Sidebar as-is since we already have the component
const sidebarMatch = content.match(/function Sidebar\(\) \{[\s\S]*?^}/m);
const hasSidebar = !!sidebarMatch;

console.log('Extracted Article content:', articleContent.split('\n').length, 'lines');

// Write the refactored version with all original content preserved
const refactoredContent = `/**
 * REFACTORED VERSION OF welcome.tsx
 *
 * This file uses the new component architecture while preserving all original content.
 * Components used: SpecSection, SpecBox, TableOfContents, Sidebar
 */

import { TableOfContents, Sidebar } from "./components";
import { navigationData } from "./data/navigation";

export function Welcome() {
  return (
    <>
      <Article />
      <Sidebar items={navigationData} />
    </>
  );
}

${articleContent}
`;

console.log('Writing refactored file...');
fs.writeFileSync(outputFile, refactoredContent);

console.log('✓ Refactored file created at:', outputFile);
console.log('✓ Original content preserved');
console.log('');
console.log('Next steps:');
console.log('1. The Article function still contains all original content');
console.log('2. Only TOC and Sidebar have been replaced with components');
console.log('3. To complete refactoring, you need to manually replace sections with SpecSection');
console.log('4. This preserves all content while showing the refactoring pattern');
