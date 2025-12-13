/**
 * Fix sections A and B closing tags
 */

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'welcome.refactored.tsx');

console.log('Reading file...');
let content = fs.readFileSync(file, 'utf-8');

// Track the specific lines we need to fix
// Section A closes at line 4129
// Section B closes at line 4239

// Strategy: Find the exact closing tags by looking for the pattern
// where we have SpecSection subsections (A.1, A.2, B.1, B.2, etc.)
// followed by a regular </section> close

// For section A: After A.2 (Hot rebuilding) closes, the next </section> should be </SpecSection>
// For section B: After B.5 (License) closes, the next </section> should be </SpecSection>

// Let's find section A's closing tag
// It should be right after the A.2 SpecSection closes
const sectionAPattern = /(<SpecSection\s+id="sec-Hot-rebuilding-with-nodemon"[\s\S]*?<\/SpecSection>)\s*(<\/section>)/;
content = content.replace(sectionAPattern, '$1\n      </SpecSection>');

// Find section B's closing tag
// It should be right after the B.5 SpecSection closes
const sectionBPattern = /(<SpecSection\s+id="sec-License"[\s\S]*?<\/SpecSection>)\s*(<\/section>)/;
content = content.replace(sectionBPattern, '$1\n      </SpecSection>');

console.log('Writing fixed file...');
fs.writeFileSync(file, content);

// Verify the counts
const specSectionOpens = (content.match(/<SpecSection/g) || []).length;
const specSectionCloses = (content.match(/<\/SpecSection>/g) || []).length;
const regularSections = (content.match(/<section/g) || []).length;

console.log('\nResults:');
console.log('SpecSection opens:', specSectionOpens);
console.log('SpecSection closes:', specSectionCloses);
console.log('Regular sections remaining:', regularSections);
console.log('Match:', specSectionOpens === specSectionCloses ? '✓' : '❌');
