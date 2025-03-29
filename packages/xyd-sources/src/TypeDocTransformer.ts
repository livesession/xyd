import * as fs from "node:fs";
import * as path from "node:path";

import type {Reference, Definition} from "@xyd-js/uniform";

import type {
    JSONOutput,
    ContainerReflection,
    DeclarationReflection,
    SomeType,
    ReflectionSymbolId,
    Comment,
} from 'typedoc';
import {ReflectionKind} from "typedoc";

import {
    MultiSignatureLoader,
    signatureTextByLine,
    signatureSourceCodeByLine
} from "./SignatureText";

class TypeDocSignatureTextLoader extends MultiSignatureLoader {
    constructor(
        private project: JSONOutput.ProjectReflection,
        private packagePathMap: { [id: number]: string }
    ) {
        super();
    }

    public signatureText(
        id: number,
        line: number
    ) {
        const loader = this.getSignatuerLoader(id)
        if (!loader) {
            return
        }

        const signTxt = signatureTextByLine(loader, line)
        if (!signTxt) {
            console.warn('(TypeDocSignatureTextLoader.signatureText): Signature text is empty', id)
            return
        }

        return signTxt
    }

    public signatureSourceCode(
        id: number,
        line: number
    ) {
        const loader = this.getSignatuerLoader(id)
        if (!loader) {
            return
        }

        const sourceCode = signatureSourceCodeByLine(loader, line)
        if (!sourceCode) {
            console.warn('(TypeDocSignatureTextLoader.signatureSourceCode): Source code is empty', id)
            return
        }

        return sourceCode
    }

    private getSignatuerLoader(id: number) {
        const symbolMap = this.project.symbolIdMap[id] as ReflectionSymbolId
        if (!symbolMap) {
            console.warn('(TypeDocSignatureTextLoader.getSignatuerLoader): Symbol not found', id)
            return
        }

        const fullPath = this.packagePathMap[id]
        if (!fullPath) {
            console.warn('(TypeDocSignatureTextLoader.getSignatuerLoader): Package path not found for symbol', symbolMap.packageName)
            return
        }

        const loader = this.load(fullPath)
        if (!loader) {
            console.warn('(TypeDocSignatureTextLoader.getSignatuerLoader): Loader not found', fullPath)
            return
        }

        return loader
    }
}

class Transformer {
    public packagePathMap: { [id: number]: string } = {};
    public signatureTextLoader!: TypeDocSignatureTextLoader;

    constructor(
        private rootPath: string,
        protected project: JSONOutput.ProjectReflection,
        protected references: Reference[] = []
    ) {
        const packagePathMap = this.createPackagePathMap()
        if (packagePathMap) {
            this.packagePathMap = packagePathMap
        }
    }

    private createPackagePathMap() {
        const packagePathMap: { [id: number]: string } = {};
        const packageJsonPaths = this.findPackageJsonPaths(this.rootPath);

        if (!packageJsonPaths.length) {
            console.warn('(Transformer.createPackagePathMap): No package.json found in rootPath', this.rootPath)
            return {packageMap: null, moduleRootMap: null}
        }

        for (const packageJsonPath of packageJsonPaths) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const packageName = packageJson.name;
            const moduleRoot = path.dirname(packageJsonPath);

            if (!packageName) {
                console.warn('(Transformer.createPackagePathMap): Package name not found in package.json', packageJsonPath)
                continue
            }

            for (const id in this.project.symbolIdMap) {
                const symbolMap = this.project.symbolIdMap[id] as ReflectionSymbolId;

                if (symbolMap.packageName === packageName) {
                    const fullPath = path.join(moduleRoot, symbolMap.packagePath);
                    packagePathMap[Number.parseInt(id)] = fullPath;
                }
            }
        }

        return packagePathMap
    }

    private findPackageJsonPaths(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);

        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.findPackageJsonPaths(filePath));
            } else if (file === 'package.json') {
                results.push(filePath);
            }
        }
        return results;
    }
}

export function typedocToUniform(
    rootPath: string,
    project: JSONOutput.ProjectReflection
): Reference[] {
    const references: Reference[] = []
    const transformer = new Transformer(
        rootPath,
        project,
        references
    )
    const signatureTextLoader = new TypeDocSignatureTextLoader(
        project,
        transformer.packagePathMap,
    )
    transformer.signatureTextLoader = signatureTextLoader

    // TODO: in the future abstraction?
    if (project.kind !== ReflectionKind.Project) {
        throw new Error('Project reflection expected');
    }

    for (const child of project.children || []) {
        if (!("kind" in child)) {
            throw new Error('(typedocToUniform): Child reflection expected in project childrens');
        }

        if (typeof child.kind != "number") {
            throw new Error('(typedocToUniform): Child reflection kind expected to be a number');
        }

        if (!(child.kind satisfies ReflectionKind)) {
            throw new Error('(typedocToUniform): Child reflection kind expected to be a valid ReflectionKind');
        }

        const kind = child.kind as ReflectionKind

        switch (kind) {
            case ReflectionKind.Module: {
                const container = child as ContainerReflection

                for (const group of container.children || []) {
                    const ref = typedocGroupToUniform.call(
                        transformer,
                        group
                    )

                    if (!ref) {
                        continue
                    }

                    ref.context = {
                        ...ref.context,
                        package: container.name,
                    }
                    references.push(ref)
                }

                break
            }

            case ReflectionKind.Function:
            case ReflectionKind.Class: {
                if (!(child satisfies DeclarationReflection)) {
                    throw new Error('(typedocToUniform): Function reflection expected to be a DeclarationReflection');
                }

                const ref = typedocGroupToUniform.call(
                    transformer,
                    child as DeclarationReflection
                )

                if (!ref) {
                    break
                }

                ref.context = {
                    ...ref.context,
                    package: project.name,
                }
                references.push(ref)

                break
            }

            default: {
                console.warn("(typedocToUniform): Another children project kind not supported", child.kind)
            }
        }
    }

    return references
}

function typedocGroupToUniform(
    this: Transformer,
    group: DeclarationReflection
) {
    let ref: Reference | undefined

    switch (group.kind) {
        case ReflectionKind.Class: {
            ref = jsClassToUniformRef.call(this, group)

            break
        }
        case ReflectionKind.Function: {
            ref = jsFunctionToUniformRef.call(this, group)

            break
        }
        default: {
            console.warn('(typedocGroupToUniform): Unhandled reflection kind', group.kind)
        }
    }

    return ref
}

function jsClassToUniformRef(
    this: Transformer,
    dec: DeclarationReflection
) {
    const definitions: Definition[] = []

    const ref: Reference = {
        title: `Class ${dec.name}`,
        canonical: `class-${dec.name}`,
        description: '',
        context: {},
        examples: {
            groups: []
        },
        definitions
    }

    const declarationCtx = declarationUniformContext.call(this, dec)
    if (declarationCtx) {
        ref.context = {
            ...ref.context,
            ...declarationCtx
        }
    }

    if (dec.comment) {
        const description = commentToUniform(dec.comment)
        const group = (declarationCtx?.packageName.split('/') || [])
            .map(name => `"${name}"`)
            .join(",")

        ref.description = `---
title: ${dec.name} 
group: [${group}, Classes]
---
${description}`
    }

    // handle constructor
    {
        const constructor = dec.children?.find(child => child.name === 'constructor')
        if (constructor?.signatures?.[0]) {
            const constructorDef: Definition = {
                title: 'Constructor',
                properties: []
            }

            const constructorSign = constructor.signatures[0]
            for (const param of constructorSign.parameters || []) {
                if (!param.type) {
                    console.warn('(jsClassToUniformRef): Constructor parameter type not found', param.name)
                    continue
                }

                let description = ""
                if (param.comment) {
                    description = commentToUniform(param.comment)
                }
                constructorDef.properties.push({
                    name: param.name,
                    type: someTypeToUniformType(param.type),
                    description
                })
            }
            definitions.push(constructorDef)
        }
    }

    // handle methods
    {
        const methods = dec.children?.filter(child =>
            child.kind === ReflectionKind.Method && child.name !== 'constructor'
        ) || []

        if (methods.length > 0) {
            const methodsDef: Definition = {
                title: 'Methods',
                properties: []
            }

            for (const method of methods) {
                if (!method.signatures?.[0]) continue

                const methodSign = method.signatures[0]
                let methodDesc = ""
                if (methodSign.comment) {
                    methodDesc = commentToUniform(methodSign.comment)
                }

                methodsDef.properties.push({
                    name: method.name,
                    type: methodSign.type ? someTypeToUniformType(methodSign.type) : "void",
                    description: methodDesc
                })
            }

            definitions.push(methodsDef)
        }
    }

    return ref
}

function jsFunctionToUniformRef(
    this: Transformer,
    dec: DeclarationReflection
) {
    const definitions: Definition[] = []
    const ref: Reference = {
        title: `Function ${dec.name}`,
        canonical: `fn-${dec.name}`,
        description: '',
        context: {},
        examples: {
            groups: [],
        },
        definitions,
    }

    const declarationCtx = declarationUniformContext.call(this, dec)
    if (declarationCtx) {
        ref.context = {
            ...ref.context,
            ...declarationCtx
        }
    }

    const signatures = dec.signatures || []
    if (signatures.length > 1) {
        console.error('(jsFunctionToUniformRef): Multiple signatures not supported for function declaration', dec.name)
        return
    }

    for (const sign of dec.signatures || []) {
        {
            if (sign.comment) {
                const description = commentToUniform(sign.comment)
                const group = (declarationCtx?.packageName.split('/') || [])
                    .map(name => `"${name}"`)
                    .join(",")

                ref.description = `---
title: ${dec.name}
group: [${group}, Functions]
---
${description}`
            }
        }

        // handle returns
        {
            const returnsUniformDef: Definition = {
                title: 'Returns',
                properties: [],
            }

            if (sign.type) {
                let desc = ""

                if (sign.comment) {
                    desc = returnCommentToUniform(sign.comment) || ""
                }
                returnsUniformDef.properties.push({
                    name: "",
                    type: someTypeToUniformType(sign.type),
                    description: desc
                })
            }

            ref.definitions.push(returnsUniformDef)
        }

        // handle parameters
        {
            const parametersUniformDef: Definition = {
                title: 'Parameters',
                properties: [],
            }

            for (const param of sign.parameters || []) {
                if (!param.type) {
                    console.warn('(jsFunctionToUniformRef): Parameter type not found', param.name)
                    continue
                }

                let description = ""
                if (param.comment) {
                    description = commentToUniform(param.comment)
                }
                parametersUniformDef.properties.push({
                    name: param.name,
                    type: someTypeToUniformType(param.type),
                    description
                })
            }

            ref.definitions.push(parametersUniformDef)
        }
    }

    return ref
}


function declarationUniformContext(
    this: Transformer,
    dec: DeclarationReflection,
) {
    if (!dec.sources || !dec.sources.length) {
        return
    }

    if (dec.sources.length > 1) {
        console.warn('(declarationUniformContext): Multiple sources not supported for function declaration', dec.name)
        return
    }

    const source = dec.sources[0]
    if (!source.fileName) {
        return
    }

    const signTxt = this.signatureTextLoader.signatureText(
        dec.id,
        source.line
    ) || ""

    const sourceCode = this.signatureTextLoader.signatureSourceCode(
        dec.id,
        source.line
    ) || ""

    // Get the symbol map to find the package path
    const symbolMap = this.project.symbolIdMap[dec.id] as ReflectionSymbolId
    if (!symbolMap) {
        console.warn('(declarationUniformContext): Symbol not found', dec.id)
        return
    }

    // Use the packagePath directly as it's already relative to the module root
    const fileFullPath = symbolMap.packagePath

    return {
        packageName: symbolMap.packageName,
        fileName: source.fileName,
        fileFullPath,
        line: source.line,
        col: source.character,
        signatureText: {
            code: signTxt,
            lang: "ts",
        },
        sourcecode: {
            code: sourceCode,
            lang: "ts"
        }
    }
}

function someTypeToUniformType(someType: SomeType) {
    if (!("name" in someType)) {
        console.warn('SomeType does not have name property', someType)
        return ""
    }

    switch (someType.type) {
        case "reference": {
            // TODO: abstract definition properties like GenericDefinitionProperty extends DefinitionProperty?
            return `<${someType.name}>`
        }
        default: {
            return someType.name
        }
    }
}

function commentToUniform(comment: Comment) {
    let desc = ""

    for (const summary of comment?.summary || []) {
        desc += `${summary.text}\n`
    }

    return desc
}

function returnCommentToUniform(comment: Comment) {
    if (!comment.blockTags || !comment.blockTags.length) {
        return
    }

    let desc = ""
    for (const tag of comment.blockTags) {
        if (tag.tag === "@returns") {
            for (const content of tag.content || []) {
                desc += `${content.text}\n`
            }
        }
    }

    return desc
}