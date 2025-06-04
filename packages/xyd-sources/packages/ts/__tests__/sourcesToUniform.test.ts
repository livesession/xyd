import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SignatureTextLoader, MultiSignatureLoader } from '../SignatureText';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { sourcesToUniform, sourcesToUniformV2 } from '..';
import { uniformToReactUniform } from '../../react/uniformToReactUniform';
import { TypeDocReferenceContext } from '@xyd-js/uniform';
import { Reference } from '@xyd-js/uniform';

describe('SignatureText', () => {
    const fixturesBasePath = path.resolve("packages/ts/__fixtures__")

    const testFilePath = path.join(fixturesBasePath, 'test-file.ts');
    const outputFilePath = path.join(fixturesBasePath, 'references-output.json');
    const outputFilePathReact = path.join(fixturesBasePath, 'references-output-react.json');
    const outputFilePathProject = path.join(fixturesBasePath, 'references-output-project.json');

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

        //     const references = await sourcesToUniformV2(basePath,
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
            const packagePath = path.resolve(fixturesBasePath, "react/react-a")

            const resp = await sourcesToUniformV2(packagePath,
                [
                    "src/TestBasic.tsx",
                ]
            );
            if (!resp || !resp.references || !resp.projectJson) {
                throw new Error("Failed to generate documentation.")
            }

            const references = resp.references as Reference<TypeDocReferenceContext>[]
            const reactUniform = uniformToReactUniform(references, resp.projectJson)

            fs.writeFileSync(outputFilePath, JSON.stringify(resp?.references, null, 2));
            fs.writeFileSync(outputFilePathProject, JSON.stringify(resp?.projectJson, null, 2));

            fs.writeFileSync(outputFilePathReact, JSON.stringify(reactUniform, null, 2));

            // Save references to a file for inspection
            console.log(`References saved to: ${outputFilePath}`);
            console.log(`React Uniform saved to: ${outputFilePathReact}`);
        });

        it('should return a reference to react component', async () => {
            return
            const packagePath = path.resolve(fixturesBasePath, "packages3")

            const resp = await sourcesToUniformV2(packagePath,
                [
                    path.join(packagePath, "package-a"),
                ]
            );

            fs.writeFileSync(outputFilePath, JSON.stringify(resp?.references, null, 2));
            fs.writeFileSync(outputFilePathProject, JSON.stringify(resp?.projectJson, null, 2));
        });
    });

}); 