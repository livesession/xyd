/**
 * List of standard MDAST node types
 */
export const standardMdastTypes = [
  'root',
  'paragraph',
  'heading',
  'text',
  'emphasis',
  'strong',
  'delete',
  'blockquote',
  'code',
  'link',
  'image',
  'list',
  'listItem',
  'table',
  'tableRow',
  'tableCell',
  'html',
  'break',
  'thematicBreak',
  'yaml',
  'definition',
  'footnoteDefinition',
  'footnoteReference',
  'inlineCode',
  'linkReference',
  'imageReference',
  'footnote',
  'tableCaption'
];

/**
 * Checks if a given type is a standard MDAST type
 * @param type The node type to check
 * @returns True if the type is a standard MDAST type, false otherwise
 */
export function isStandardMdastType(type: string): boolean {
  return standardMdastTypes.includes(type);
} 