import { lazy } from "react"

// TODO: find better way to do this

const Button = lazy(() => import("@livesession/design-system").then(module => ({ default: module.Button })))
const TextInput = lazy(() => import("@livesession/design-system").then(module => ({ default: module.TextInput })))
const Select = lazy(() => import("@livesession/design-system").then(module => ({ default: module.Select })))
const Switch = lazy(() => import("@livesession/design-system").then(module => ({ default: module.Switch })))
const Heading = lazy(() => import("@livesession/design-system").then(module => ({ default: module.Heading })))

const Layout = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Layout })))
const Dock = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Dock })))
const DockList = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Dock.List })))
const DockMenuItem = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Dock.MenuItem })))

const Sidebar = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Sidebar })))
const SidebarMenu = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Sidebar.Menu })))
const SidebarMenuList = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Sidebar.MenuList })))
const SidebarMenuItem = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Sidebar.MenuItem })))

const Surface = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Surface })))
const SurfaceHeader = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Surface.Header })))
const SurfaceScroll = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Surface.Scroll })))
const SurfaceNavigation = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Surface.Navigation })))

const SignInPage = lazy(() => import("@livesession/authjs-ui").then(module => ({ default: module.AuthUiSignInPage.Default })))

export {
    Button,
    TextInput,
    Select,
    Switch,
    Heading,

    Layout,

    Dock,
    DockList,
    DockMenuItem,

    Sidebar,
    SidebarMenu,
    SidebarMenuList,
    SidebarMenuItem,

    Surface,
    SurfaceHeader,
    SurfaceScroll,
    SurfaceNavigation,

    SignInPage,
}