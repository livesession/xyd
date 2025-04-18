// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// import { reactDocgenToUniform } from './ReactDocgenTransformer';

// // Get current directory in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Get workspace root path
// const workspaceRoot = path.resolve(__dirname, '../../../');

// // Read the Badge component file
// const badgePath = path.join(workspaceRoot, 'packages/xyd-components/src/writer/Badge/Badge.tsx');
// const badgeCode = fs.readFileSync(badgePath, 'utf8');

// // Convert to uniform format
// const uniformRef = reactDocgenToUniform(badgeCode, badgePath);
// console.log(JSON.stringify(uniformRef, null, 2));

export { reactDocgenToUniform } from './ReactDocgenTransformer';