/// <reference types="vite/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.vsix' {
  const whenReady: Promise<void>
  export { whenReady }
}
