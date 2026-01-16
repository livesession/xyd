import { Project } from 'ts-morph';
import { globSync } from 'glob';
import fs from 'fs';
import path from 'path';

// Get all files (not directories) from fixtures
const allFiles = globSync('./src/__fixtures__/**/*.*');
const files = allFiles.filter(file => {
  const stats = fs.statSync(file);
  return stats.isFile();
});

// Remove the src/__fixtures__/ prefix and normalize paths
const normalizedFiles = files
  .map(file => {
    const relativePath = path.relative('./src/__fixtures__', file);
    return relativePath.replace(/\\/g, '/'); // Normalize to forward slashes
  })
  .filter(file => file !== 'opencli-spec.json'); // Exclude opencli-spec.json

const project = new Project();

const sourceFile = project.createSourceFile("./src/__tests__/types.gen.ts", '', { overwrite: true });
sourceFile.addTypeAlias({
  name: 'FixturePath',
  type: normalizedFiles.map(f => `"${f}"`).join(' | '),
  isExported: true,
});

sourceFile.saveSync();