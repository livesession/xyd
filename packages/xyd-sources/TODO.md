1. use doc extractors:
* go - godoc
* python - https://github.com/mkdocstrings/griffe

2. add docs for generation requirements: <--- maybe find better solution in the future?
    1. tsconfig is needed
    2. package.json is needed
    3. "outDir": "./dist", in tsconfig compilerOptions is needed
    4. main is needed in package.json