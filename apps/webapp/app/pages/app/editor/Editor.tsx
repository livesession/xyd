import { lazy } from 'react'
import { loader } from './loader'

const EditorWorkbench = lazy(() => import('./EditorWorkbench').then(module => ({
    default: module.EditorWorkbench
})))

// Export the loader from the server file
export { loader }

export default function Editor() {
    return <EditorWorkbench />
}


