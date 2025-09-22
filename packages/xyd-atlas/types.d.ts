import * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'atlas-decorator': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

        'atlas-apiref-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-item-showcase': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-samples': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-definitions': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-properties': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-variant': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-prop': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-propname': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-proptype': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-propmeta': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-meta-info': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        'atlas-apiref-propdescription': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}