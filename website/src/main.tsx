import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from '@primer/react-brand'

import '@primer/react-brand/lib/css/main.css'
import '@primer/react-brand/fonts/fonts.css'

import App from './App.tsx'

import './index.css'
import { preload } from "@code-hike/lighter";

preload(["typescript", "shell", "markdown", "mdx", "tsx"], "material-default").then(() => { // TODO: make it better - use nextjs/remix
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <ThemeProvider colorMode="dark">
                <App />
            </ThemeProvider>
        </StrictMode>,
    )
})

