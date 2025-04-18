import { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

export function componentLike(
    componentName: string,
    props: Record<string, any>,
    children: any[]
) {
    // Create JSX props from all resolved props
    const jsxProps = Object.entries(props).map(([key, value]) =>
        `${key}={${JSON.stringify(value)}}`
    );

    // Parse the JSX string to get proper MDX attributes
    const mdxString = `<Fragment ${jsxProps.join(" ")}></Fragment>`;

    const ast = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(mdxString);

    // Extract the attributes from the parsed AST
    const attributes: MdxJsxAttribute[] = [];
    if (ast &&
        ast.children &&
        ast.children[0] &&
        'type' in ast.children[0] &&
        ast.children[0].type === 'mdxJsxFlowElement' &&
        'attributes' in ast.children[0] &&
        ast.children[0].attributes) {
        for (const attr of ast.children[0].attributes) {
            if (attr.type === 'mdxJsxAttribute') {
                attributes.push(attr);
            }
        }
    }

    // Create the MDX JSX element with the extracted attributes
    return {
        type: 'mdxJsxFlowElement',
        name: componentName,
        attributes: attributes,
        children
    } as MdxJsxFlowElement;
}