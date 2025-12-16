import {
  type RouteConfig,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("", "./pages/_guard/Guard.tsx", [
    route("signin", "./pages/signin/SignIn.tsx"),
    route("app", "./pages/app/App.tsx", [
      route("home", "./pages/app/home/Home.tsx"),
      route("editor", "./pages/app/editor/Editor.tsx"),
      route("apps", "./pages/app/apps/Apps.tsx"),

      route("settings", "./pages/app/settings/Settings.tsx", [
        route(
          "general",
          "./pages/app/settings/(settings)/general/General.tsx"
        ),
        route(
          "custom-domain",
          "./pages/app/settings/(settings)/custom-domain/CustomDomain.tsx"
        ),
        route(
          "git-settings",
          "./pages/app/settings/(settings)/git-settings/GitSettings.tsx"
        ),
      ]),
    ]),
  ]),

  ...prefix("api", [
    ...prefix("auth", [
      route("google", "./api/auth/google/index.ts"),
      route("google/callback", "./api/auth/google/callback.ts"),
      route("me", "./api/auth/me.ts"),
      route("signout", "./api/auth/signout.ts"),
    ]),
    ...prefix("github", [
      route("auth", "./api/github/auth.ts"),
      route("callback", "./api/github/callback.ts"),
      route("organizations", "./api/github/organizations.ts"),
      route("repositories", "./api/github/repositories.ts"),
      route("branches", "./api/github/branches.ts"),
      route("settings", "./api/github/settings.ts"),
    ]),
  ]),

  route("*", "./pages/404.tsx"),
] satisfies RouteConfig;
