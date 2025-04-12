1. use doc extractors:
* go - godoc
* python - https://github.com/mkdocstrings/griffe
* js - https://github.com/TypeStrong/typedoc

2. issues with: https://github.com/TypeStrong/typedoc/blob/3a3976da192126139c36dd711ab636f840d0c0ce/src/lib/application.ts#L51

3. add docs for generation requirements: <--- maybe find better solution in the future?
    1. tsconfig is needed
    2. package.json is needed
    3. "outDir": "./dist", in tsconfig compilerOptions is needed
    4. main is needed in package.json