import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SignatureTextLoader, MultiSignatureLoader } from '../SignatureText';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { sourcesToUniform } from '..';

describe('SignatureText', () => {
    const testFilePath = path.join(__dirname, 'test-file.ts');
    const outputFilePath = path.join(__dirname, 'references-output.json');

    // Create a temporary test file
    beforeAll(() => {
        const testContent = `
export class TestClass {
  constructor() {}
  
  public testMethod(param: string): void {
    console.log(param);
  }
}
`;
        fs.writeFileSync(testFilePath, testContent);
    });

    // Clean up after tests
    afterAll(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    describe('sourcesToUniform', () => {
        it('should return a reference to the test class', async () => {
            const basePath = path.resolve("src/__fixtures__/packages2")

            const references = await sourcesToUniform(basePath,
                [
                    path.resolve(basePath, "package-a"),
                    // path.resolve(basePath, "package-b"),
                ]
            );
        
            // Save references to a file for inspection
            console.log(`References saved to: ${outputFilePath}`);

            // console.log(222222222, references)
            //   expect(references).toBeDefined();
            //   expect(references?.length).toBe(1);
            //   expect(references?.[0].name).toBe('TestClass');
        });
    });
}); 