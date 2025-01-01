import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as atlas from './packages/css/src/tokens/atlas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputPath = path.resolve(__dirname, 'dist/tokens.css');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, atlas.generateCSS());
console.log('tokens.css generated successfully.');
