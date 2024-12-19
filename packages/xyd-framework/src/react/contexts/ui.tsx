import {createContext} from 'react';

export const UIContext = createContext({
    href: '',
    setHref: (v: any) => {}
});