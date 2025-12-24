import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
// import { stdContent, ReactContent } from '@xyd-js/components/content'; TODO

// Get the component implementations
// const components = stdContent.call(new ReactContent());

// Specific implementations mapping NodeView props to Component props

export const HeadingNode = ({ node }: any) => {
    return null
    // const level = node.attrs.level || 1;
    // const Component = components[`H${level}` as keyof typeof components] || components.H1;
    
    // return   <Component>
    //        <NodeViewContent />
    // </Component>

    // return (
    //     <NodeViewWrapper>
    //         <Component>
    //             <NodeViewContent />
    //         </Component>
    //     </NodeViewWrapper>
    // );
};

export const ParagraphNode = () => {
    return null
    // return (
    //     <NodeViewWrapper>
    //         <components.P>
    //             <NodeViewContent />
    //         </components.P>
    //     </NodeViewWrapper>
    // );
};

export const ListNode = ({ node }: any) => {
    return null
//    const isOrdered = node.type.name === 'orderedList';
//    const Component = isOrdered ? components.Ol : components.Ul;
   
//     return (
//         <NodeViewWrapper>
//             <Component>
//                 <NodeViewContent />
//             </Component>
//         </NodeViewWrapper>
//     );
};

export const ListItemNode = () => {
    return null
    // return (
    //     <NodeViewWrapper>
    //         <components.Li>
    //             <NodeViewContent />
    //         </components.Li>
    //     </NodeViewWrapper>
    // );
};
