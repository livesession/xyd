import * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        // Code
        'xyd-code-bg': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-code-linenumber': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-code-mark': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-code-pre': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-code-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-code-copy': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-codetabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-codetabs-languages': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

        // Layout
        'xyd-layout-primary': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

        // Components
        'xyd-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-callout': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-breadcrumbs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-guidecard': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-guidecard-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-navlinks': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-steps': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-steps-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-table-cell': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-toccard': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-underlinenav': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-underlinenav-content': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-videoguide-miniature': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-content-decorator': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>; 
        'xyd-grid-decorator': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        // Kit
        'xyd-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}