// TODO: !!! in the future better solution? currently its a hack to override mdx components (react-components) declared in the file !!!
export function recmaOverrideComponents() {
    return (tree: any) => {
      for (let i = 0; i < tree.body.length; i++) {
        const node = tree.body[i];
  
        if (
          node.type === 'FunctionDeclaration' &&
          /^[A-Z]/.test(node.id.name)
        ) {
          const name = node.id.name;
  
          if (name === "MDXContent") {
            continue
          }
  
          // Fallback: () => null
          const nullFn = {
            type: 'ArrowFunctionExpression',
            params: [],
            body: { type: 'Literal', value: null },
            expression: true,
          };
  
          const fileComponentsAndProp = {
            type: 'LogicalExpression',
            operator: '&&',
            left: { type: 'Identifier', name: 'fileComponents' },
            right: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'fileComponents' },
              property: { type: 'Identifier', name },
              computed: false,
            },
          };
  
          const fileComponentsFalse = {
            type: 'BinaryExpression',
            operator: '===',
            left: { type: 'Identifier', name: 'fileComponents' },
            right: { type: 'Literal', value: false },
          };
  
          const fallback = {
            type: 'ConditionalExpression',
            test: fileComponentsFalse,
            consequent: nullFn, // ✅ return a function that returns null
            alternate: { type: 'Identifier', name },
          };
  
          const overrideExpr = {
            type: 'ConditionalExpression',
            test: fileComponentsAndProp,
            consequent: fileComponentsAndProp,
            alternate: fallback,
          };
  
          const assignOverride = {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: '=',
              left: { type: 'Identifier', name },
              right: overrideExpr,
            },
          };
  
          tree.body.splice(i + 1, 0, assignOverride);
          i++; // Skip newly inserted node
        }
      }
    };
  }
  