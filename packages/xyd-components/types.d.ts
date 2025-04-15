import * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
        interface IntrinsicElements {
            'xyd-layout-primary': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
  }
}