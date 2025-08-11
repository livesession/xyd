import * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'xyd-built-with': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-page-footer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'xyd-secondary-content': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}