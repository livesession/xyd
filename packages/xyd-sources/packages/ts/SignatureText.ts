import * as ts from 'typescript';
import * as fs from "node:fs";

// TODO: in the future more lightweight solution ??? - currently it's fine cuz it uses battle-tested TypeScript API

const printer = ts.createPrinter({removeComments: true});

export class SignatureTextLoader {
    protected sourceFile: ts.SourceFile;

    constructor(sourcePath: string) {
        const source = fs.readFileSync(sourcePath, 'utf-8');

        this.sourceFile = ts.createSourceFile(
            sourcePath,
            source,
            ts.ScriptTarget.Latest,
            true
        );
    }
}

export class MultiSignatureLoader {
    private loaders: Map<string, SignatureTextLoader>

    constructor() {
        this.loaders = new Map<string, SignatureTextLoader>()
    }

    protected load(path: string) {
        if (this.loaders.has(path)) {
            return this.loaders.get(path)
        }

        const loader = new SignatureTextLoader(path)
        this.loaders.set(path, loader)

        return loader
    }
}

/**
 * Get the signature text of a function, class, interface, enum, or type alias at a specific line.
 *
 * @param sign - instance of SignatureText
 * @param targetLine - the line number of the signature in source code
 *
 * @returns code friendly signature text
 */
export function signatureTextByLine(
    sign: SignatureTextLoader,
    targetLine: number,
    options?: any // TODO: fix any
) {
    return signatureText.call(sign, targetLine, options)
}

/**
 * Get the source code of a function, class, interface, enum, or type alias at a specific line.
 *
 * @param sign - instance of SignatureText
 * @param targetLine - the line number of the signature in source code
 *
 * @returns source code of the signature
 */
export function signatureSourceCodeByLine(
    sign: SignatureTextLoader,
    targetLine: number
) {
    return signatureSourceCode.call(sign, targetLine)
}

function signatureText(
    this: SignatureTextLoader,
    targetLine: number,
    options?: any // TODO: fix any
) {
    const sourceFile = this.sourceFile;
    const signatureNode = findSignatureNode.call(
        this,
        sourceFile,
        [targetLine]
    );

    if (!signatureNode) {
        console.error("(signatureText): `signatureNode` is empty, something went wrong");
        return
    }

    const printableSignatureNode = nodeToPrintableSignatureNode(signatureNode, options?.typeOnly);
    if (!printableSignatureNode) {
        console.error("(signatureText): cannot convert `signatureNode` to `printableSignatureNode`");
        return
    }

    return printer.printNode(ts.EmitHint.Unspecified, printableSignatureNode, sourceFile).trim()
}

// TODO: this function is probably not optimized well (recursion when not needed)
function findSignatureNode(
    this: SignatureTextLoader,
    node: ts.Node,
    targetLines: number[]
) {
    let isSourceFile = false
    if (node === node.getSourceFile()) {
        isSourceFile = true
    }

    if (!isSourceFile && isNodeAtLine(node, targetLines, this.sourceFile)) {
        return node
    }

    let signatureNode: ts.Node | undefined;

    ts.forEachChild(node, (n) => {
        if (signatureNode) {
            return
        }
        signatureNode = findSignatureNode.call(this, n, targetLines)
    });

    return signatureNode
}


function signatureSourceCode(
    this: SignatureTextLoader,
    targetLine: number
) {
    const sourceFile = this.sourceFile;
    const signatureNode = findSignatureNode.call(
        this,
        sourceFile,
        [targetLine]
    );

    if (!signatureNode) {
        console.error("(signatureSourceCode): `signatureNode` is empty, something went wrong");
        return
    }

    // Get the start and end positions of the node
    const start = signatureNode.getStart(sourceFile);
    const end = signatureNode.getEnd();

    // Get the source text between start and end
    return sourceFile.text.substring(start, end).trim();
}

function nodeToPrintableSignatureNode(node: ts.Node, typeOnly: boolean = false): ts.Node | undefined {
    if (typeOnly) {
        if ("type" in node) {
            return node.type as ts.Node
        }

        return
    }

    let resp: ts.Node | undefined;

    if (ts.isFunctionDeclaration(node)) {
        resp = ts.factory.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            undefined
        );
    } else if (ts.isClassDeclaration(node)) {
        resp = ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            []
        );
    } else if (ts.isInterfaceDeclaration(node)) {
        resp = ts.factory.updateInterfaceDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            []
        );
    } else if (ts.isEnumDeclaration(node)) {
        resp = ts.factory.updateEnumDeclaration(
            node,
            node.modifiers,
            node.name,
            []
        );
    } else if (ts.isTypeAliasDeclaration(node)) {
        resp = ts.factory.updateTypeAliasDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.type
        );
    } else if (ts.isPropertySignature(node)) {
        resp = ts.factory.updatePropertySignature(
            node,
            node.modifiers,
            node.name,
            node.questionToken,
            node.type
        );
    } else {
        resp = node
    }

    if (!resp) {
        console.error("(nodeToPrintableSignatureNode): resp is empty, something went wrong");
        return;
    }

    return resp
}

function isNodeAtLine(node: ts.Node, lines: number[], sf: ts.SourceFile): boolean {
    const {line: startLine} = sf.getLineAndCharacterOfPosition(node.getStart());

    return lines.includes(startLine + 1); // lines are 0-based internally
}



