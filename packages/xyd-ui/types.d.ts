import * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        // UI
        'xyd-nav': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-nav-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-progressbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar-item-header': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar-subtree': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar-footer-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-sidebar-tabs-dropdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-collapse': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-subnav': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-subnav-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-toc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-toc-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}