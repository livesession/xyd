import * as fs from "node:fs";
import * as path from "node:path";

import type { Reference, Definition, TypeDocReferenceContext, DefinitionProperty, DefinitionPropertyTypeDef, DefinitionTypeDocMeta } from "@xyd-js/uniform";

import type {
    JSONOutput,
    ContainerReflection,
    DeclarationReflection,
    SomeType,
    ReflectionSymbolId,
    Comment,
    UnionType,
} from 'typedoc';
import { ReflectionKind } from "typedoc";

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
            return { packageMap: null, moduleRootMap: null }
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
                        packageName: container.name,
                    } as TypeDocReferenceContext;
                    references.push(ref)
                }

                break
            }

            case ReflectionKind.Function:
            case ReflectionKind.Class:
            case ReflectionKind.Interface: {
                if (!('kind' in child) || child.kind !== ReflectionKind.Function &&
                    child.kind !== ReflectionKind.Class &&
                    child.kind !== ReflectionKind.Interface) {
                    throw new Error('(typedocToUniform): Function/Class/Interface reflection expected to be a DeclarationReflection');
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
                    packageName: project.name,
                } as TypeDocReferenceContext;
                references.push(ref)

                break
            }

            case ReflectionKind.TypeAlias: {
                if (!('kind' in child) || child.kind !== ReflectionKind.TypeAlias) {
                    throw new Error('(typedocToUniform): Type alias reflection expected to be a DeclarationReflection');
                }

                const ref = jsTypeAliasToUniformRef.call(
                    transformer,
                    child as DeclarationReflection
                )

                if (!ref) {
                    break
                }

                ref.context = {
                    ...ref.context,
                    packageName: project.name,
                } as TypeDocReferenceContext;
                references.push(ref)

                break
            }

            case ReflectionKind.Enum: {
                if (!('kind' in child) || child.kind !== ReflectionKind.Enum) {
                    throw new Error('(typedocToUniform): Enum reflection expected to be a DeclarationReflection');
                }

                const ref = jsEnumToUniformRef.call(
                    transformer,
                    child as DeclarationReflection
                )

                if (!ref) {
                    break
                }

                ref.context = {
                    ...ref.context,
                    packageName: project.name,
                } as TypeDocReferenceContext;

                references.push(ref)

                break
            }

            default: {
                console.warn("(typedocToUniform): Another children project kind not supported", child.kind)
            }
        }
    }

    // Sort references by file path and line number to preserve the original order in the source files
    references.sort((a, b) => {
        // First sort by file pathc
        const contextA = a.context as unknown as TypeDocReferenceContext | undefined;
        const contextB = b.context as unknown as TypeDocReferenceContext | undefined;

        const filePathA = contextA?.fileFullPath || '';
        const filePathB = contextB?.fileFullPath || '';

        if (filePathA !== filePathB) {
            return filePathA.localeCompare(filePathB);
        }

        // Then sort by line number
        const lineA = contextA?.line || 0;
        const lineB = contextB?.line || 0;

        return lineA - lineB;
    });

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
        case ReflectionKind.Interface: {
            ref = jsInterfaceToUniformRef.call(this, group)

            break
        }
        case ReflectionKind.Enum: {
            ref = jsEnumToUniformRef.call(this, group)

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
        canonical: "",
        description: '',
        context: undefined,
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
    ref.canonical = uniformCanonical(dec, declarationCtx)

    if (dec.comment) {
        const description = commentToUniform(dec.comment)
        const group = uniformGroup(declarationCtx)

        if (ref.context) {
            ref.context.group = [
                ...group,
                "Classes"
            ]
        }

        ref.description = description
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
                let uniformType = someTypeToUniform(param.type)
                let someTypeProps = {}
                if (typeof uniformType === "object") {
                    someTypeProps = uniformType
                }

                constructorDef.properties.push({
                    name: param.name,
                    type: typeof uniformType === "string" ? uniformType : "",
                    description,
                    ...someTypeProps
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
                let type = ""
                let someTypeProps = {}
                if (methodSign.type) {          
                    if (typeof methodSign.type === "object") {
                        someTypeProps = methodSign.type
                    }

                    type = typeof methodSign.type === "string" ? methodSign.type : ""
                } else {
                    type = "void"
                }

                methodsDef.properties.push({
                    name: method.name,
                    type,
                    description: methodDesc,
                    ...someTypeProps
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
        canonical: "",
        description: '',
        context: undefined,
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
    ref.canonical = uniformCanonical(dec, declarationCtx)

    const signatures = dec.signatures || []
    if (signatures.length > 1) {
        console.error('(jsFunctionToUniformRef): Multiple signatures not supported for function declaration', dec.name)
        return
    }

    for (const sign of dec.signatures || []) {
        {
            if (sign.comment) {
                const description = commentToUniform(sign.comment)
                const group = uniformGroup(declarationCtx)

                if (ref.context) {
                    ref.context.group = [
                        ...group,
                        "Functions"
                    ]
                }

                ref.description = description
            }
        }

        // handle returns
        {
            const meta: DefinitionTypeDocMeta[] = [
                {
                    name: "type",
                    value: "returns"
                }
            ]

            const returnsUniformDef: Definition = {
                title: 'Returns',
                properties: [],
                meta
            }

            if (sign.type) {
                let desc = ""

                if (sign.comment) {
                    desc = returnCommentToUniform(sign.comment) || ""
                }

                const uniformType = someTypeToUniform(sign.type)
                let someTypeProps = {}
                if (typeof uniformType === "object") {
                    someTypeProps = uniformType
                }

                returnsUniformDef.properties.push({
                    name: "",
                    type: typeof uniformType === "string" ? uniformType : "",
                    description: desc,
                    ...someTypeProps
                })
            }

            ref.definitions.push(returnsUniformDef)
        }

        // handle parameters
        {
            const meta: DefinitionTypeDocMeta[] = [
                {
                    name: "type",
                    value: "parameters"
                }
            ]
            
            const parametersUniformDef: Definition = {
                title: 'Parameters',
                properties: [],
                meta
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

                const uniformType = someTypeToUniform(param.type)
                let someTypeProps = {}
                if (typeof uniformType === "object") {
                    someTypeProps = uniformType
                }

                const prop = {
                    name: param.name,
                    type: typeof uniformType === "string" ? uniformType : "",
                    description,
                    ...someTypeProps
                }

                switch (prop.name) {
                    case "__namedParameters": {
                        prop.name = ""
                        prop.type = "param"
                        break
                    }
                }

                parametersUniformDef.properties.push(prop)
            }

            ref.definitions.push(parametersUniformDef)
        }
    }

    return ref
}

function jsInterfaceToUniformRef(
    this: Transformer,
    dec: DeclarationReflection
) {
    const definitions: Definition[] = []

    const ref: Reference = {
        title: `Interface ${dec.name}`,
        canonical: "",
        description: '',
        context: undefined,
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
    ref.canonical = uniformCanonical(dec, declarationCtx)

    if (dec.comment) {
        const description = commentToUniform(dec.comment)
        const group = uniformGroup(declarationCtx)

        if (ref.context) {
            ref.context.group = [
                ...group,
                "Interfaces"
            ]
        }

        ref.description = description
    }

    // handle properties
    {
        const properties = dec.children?.filter(child =>
            child.kind === ReflectionKind.Property
        ) || []

        if (properties.length > 0) {
            const propertiesDef: Definition = {
                title: 'Properties',
                properties: []
            }

            for (const prop of properties) {
                if (!prop.type) {
                    console.warn('(jsInterfaceToUniformRef): Property type not found', prop.name)
                    continue
                }

                let description = ""
                if (prop.comment) {
                    description = commentToUniform(prop.comment)
                }

                const uniformType = someTypeToUniform(prop.type)
                let someTypeProps = {}
                if (typeof uniformType === "object") {
                    someTypeProps = uniformType
                }

                switch (prop.type.type) {
                    default: {
                        propertiesDef.properties.push({
                            name: prop.name,
                            type: typeof prop.type === "string" ? prop.type : "",
                            description,
                            ...someTypeProps
                        })
                        break
                    }
                }
            }

            definitions.push(propertiesDef)
        }
    }

    // handle methods
    {
        const methods = dec.children?.filter(child =>
            child.kind === ReflectionKind.Method
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
                
                let type = ""
                let someTypeProps = {}
                if (methodSign.type) {          
                    if (typeof methodSign.type === "object") {
                        someTypeProps = methodSign.type
                    }

                    type = typeof methodSign.type === "string" ? methodSign.type : ""
                } else {
                    type = "void"
                }

                methodsDef.properties.push({
                    name: method.name,
                    type,
                    description: methodDesc,
                    ...someTypeProps
                })
            }

            definitions.push(methodsDef)
        }
    }

    return ref
}

function jsTypeAliasToUniformRef(
    this: Transformer,
    dec: DeclarationReflection
) {
    const definitions: Definition[] = []

    const ref: Reference = {
        title: `Type ${dec.name}`,
        canonical: "",
        description: '',
        context: undefined,
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
    ref.canonical = uniformCanonical(dec, declarationCtx)

    if (dec.comment) {
        const description = commentToUniform(dec.comment)
        const group = uniformGroup(declarationCtx)

        if (ref.context) {
            ref.context.group = [
                ...group,
                "Types"
            ]
        }

        ref.description = description
    }

    // handle type definition
    {
        if (dec.type) {
            const typeDef: Definition = {
                title: 'Type Definition',
                properties: []
            }

            let comment = ""

            if (dec.comment) {
                comment = commentToUniform(dec.comment)
            }

            const uniformType = someTypeToUniform(dec.type)
            let someTypeProps = {}
            if (typeof uniformType === "object") {
                someTypeProps = uniformType
            }

            typeDef.properties.push({
                name: "",
                type: typeof dec.type === "string" ? dec.type : "",
                description: comment,
                ...someTypeProps
            })

            definitions.push(typeDef)
        }
    }

    return ref
}

function jsEnumToUniformRef(
    this: Transformer,
    dec: DeclarationReflection
) {
    const definitions: Definition[] = []

    const ref: Reference = {
        title: `Enum ${dec.name}`,
        canonical: "",
        description: '',
        context: undefined,
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
    ref.canonical = uniformCanonical(dec, declarationCtx)

    if (dec.comment) {
        const description = commentToUniform(dec.comment)
        const group = uniformGroup(declarationCtx)

        if (ref.context) {
            ref.context.group = [
                ...group,
                "Enums"
            ]
        }

        ref.description = description
    }

    // handle enum members
    {
        const members = dec.children?.filter(child =>
            child.kind === ReflectionKind.EnumMember
        ) || []

        if (members.length > 0) {
            const membersDef: Definition = {
                title: 'Members',
                properties: []
            }

            // Sort members by their line number to preserve the original order in the source code
            const sortedMembers = [...members].sort((a, b) => {
                if (!a.sources?.[0]?.line || !b.sources?.[0]?.line) {
                    return 0;
                }
                return a.sources[0].line - b.sources[0].line;
            });

            for (const member of sortedMembers) {
                let description = ""
                if (member.comment) {
                    description = commentToUniform(member.comment)
                }

                // Extract the enum member value
                let value = "";
                let type = "number";

                // Check if the member has a type property with a literal value
                if (member.type && typeof member.type === 'object' && member.type.type === 'literal' && member.type.value !== null) {
                    // If the value is a string, it's a string enum
                    if (typeof member.type.value === 'string') {
                        value = member.type.value;
                        type = "string";
                    } else {
                        // Otherwise it's a number enum
                        value = member.type.value.toString();
                        type = "number";
                    }
                }
                // Fallback to defaultValue if type is not available
                else if (member.defaultValue !== undefined) {
                    value = member.defaultValue.toString();
                    // Check if the value is a string (enclosed in quotes)
                    if (value.startsWith('"') && value.endsWith('"')) {
                        type = "string";
                        // Remove the quotes for display
                        value = value.substring(1, value.length - 1);
                    }
                }

                const formattedName = `${member.name} (${value})`;

                membersDef.properties.push({
                    name: formattedName,
                    type: type,
                    description
                })
            }

            definitions.push(membersDef)
        }
    }

    return ref
}

function declarationUniformContext(
    this: Transformer,
    dec: DeclarationReflection,
): TypeDocReferenceContext | undefined {
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

    const ctx: TypeDocReferenceContext = {
        symbolId: dec.id?.toString(),
        symbolName: dec.name,
        symbolKind: dec.kind,
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

    const category = uniformCategory(dec)
    if (category) {
        ctx.category = category
    }

    return ctx
}

type SomeTypeUniform = string | {
    type?: string;
    typeDef?: DefinitionPropertyTypeDef;
    properties?: DefinitionProperty[]
}

function someTypeToUniform(someType: SomeType): SomeTypeUniform {
    switch (someType.type) {
        case "reference": {
            let refType = `<${someType.qualifiedName || someType.name}>`

            if ("target" in someType && typeof someType.target === "number") {
                return {
                    type: refType,
                    typeDef: {
                        symbolId: someType.target?.toString()
                    }
                }
            }

            // TODO: abstract definition properties like GenericDefinitionProperty extends DefinitionProperty?
            return refType
        }
        case "union": {
            let types: string[] = []
            let typeDefs: DefinitionPropertyTypeDef = {}

            for (const t of someType.types) {
                const tUniform = someTypeToUniform(t)

                if (typeof tUniform === "object") {
                    types.push(tUniform.type || "")
                    if (!typeDefs.union) {
                        typeDefs.union = []
                    }

                    if (tUniform?.typeDef?.symbolId) {
                        typeDefs.union.push({
                            symbolId: tUniform.typeDef?.symbolId
                        })
                    }
                } else {
                    types.push(tUniform)
                }
            }

            return {
                type: types.join(" | "),
                typeDef: typeDefs
            }
        }
        case "literal": {
            if (typeof someType.value === "string") {
                return `"${someType.value}"`
            }
            
            return (someType.value || "").toString()
        }
        case "reflection": {
            const properties = uniformProperties(someType.declaration)

            return {
                properties
            }
        }
        default: {
            if (!("name" in someType)) {
                console.warn('SomeType does not have name property', someType.type)
                return ""
            }

            return someType.name
        }
    }
}

function commentToUniform(comment: Comment): string {
    let desc = ""

    for (const summary of comment?.summary || []) {
        desc += `${summary.text}\n`
    }

    return desc
}

function uniformCategory(dec?: DeclarationReflection): string {
    if (!dec) {
        return ""
    }

    let category = ""
    for (const signature of dec.signatures || []) {
        if (signature.comment) {
            const comment = signature.comment
            if (comment.blockTags) {
                for (const tag of comment.blockTags) {
                    if (tag.tag === "@category") {
                        for (const content of tag.content || []) {
                            category += content.text
                        }
                    }
                }
            }
        }
    }
   
    return category
}

function returnCommentToUniform(comment: Comment): string {
    if (!comment.blockTags || !comment.blockTags.length) {
        return ""
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

// TODO: recursive
function uniformProperties(dec: DeclarationReflection) {
    const properties: DefinitionProperty[] = []

    for (const child of dec.children || []) {
        switch (child.kind) {
            case ReflectionKind.Property: {
                const prop = child

                if (!prop.type) {
                    console.warn('(jsInterfaceToUniformRef): Property type not found', prop.name)
                    continue
                }

                let description = ""
                if (prop.comment) {
                    description = commentToUniform(prop.comment)
                }

                const uniformType = someTypeToUniform(prop.type)
                let someTypeProps = {}
                if (typeof uniformType === "object") {
                    someTypeProps = uniformType
                }

                properties.push({
                    name: prop.name,
                    type: typeof uniformType === "string" ? uniformType : "",
                    description,
                    ...someTypeProps
                })

                break
            }
            default: {
                console.warn('(uniformProperties): Unsupported child kind', child.kind)
            }
        }
    }

    return properties
}

function uniformGroup(ctx?: TypeDocReferenceContext): string[] {
    if (!ctx) {
        return []
    }

    const group = ctx.packageName.split("/")

    return group
}

function uniformCanonical(dec: DeclarationReflection, ctx: TypeDocReferenceContext): string {
    const parts: string[] = []
    if (ctx.packageName) {
        parts.push(ctx.packageName)
    }

    switch (dec.kind) {
        case ReflectionKind.Class: {
            parts.push("classes", dec.name)
            break
        }
        case ReflectionKind.Interface: {
            parts.push("interfaces", dec.name)
            break
        }
        case ReflectionKind.Function: {
            parts.push("functions", dec.name)
            break
        }
        case ReflectionKind.TypeAlias: {
            parts.push("types", dec.name)
            break
        }
        case ReflectionKind.Enum: {
            parts.push("enums", dec.name)
            break
        }
        default: {
            return ""
        }
    }

    return parts.join("/")
}