import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SignatureTextLoader, MultiSignatureLoader } from '../SignatureText';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { sourcesToUniform } from '..';

describe('SignatureText', () => {
    const fixturesBasePath = path.resolve("packages/ts/__fixtures__")

    const testFilePath = path.join(fixturesBasePath, 'test-file.ts');
    const outputFilePath = path.join(fixturesBasePath, 'references-output.json');

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
        // it('should return a reference to the test class', async () => {
        //     const basePath = path.resolve(fixturesBasePath, "packages2")

        //     const references = await sourcesToUniform(basePath,
        //         [
        //             path.resolve(basePath, "package-a"),
        //             // path.resolve(basePath, "package-b"),
        //         ]
        //     );

        //     fs.writeFileSync(outputFilePath, JSON.stringify(references, null, 2));
        //     // Save references to a file for inspection
        //     console.log(`References saved to: ${outputFilePath}`);
        // });

        it('should return a reference to react component', async () => {
            const basePath = path.resolve(fixturesBasePath, "react")

            const references = await sourcesToUniform(basePath,
                [
                    path.resolve(basePath, "react-a"),
                ]
            );

            fs.writeFileSync(outputFilePath, JSON.stringify(references, null, 2));
            // Save references to a file for inspection
            console.log(`References saved to: ${outputFilePath}`);
        });
    });

}); 