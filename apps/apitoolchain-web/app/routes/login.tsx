import {
  AuthBackground,
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthFormFooter,
  AuthGoogleMark,
  AuthHeader,
  AuthInput,
  AuthLink,
  AuthSocialButton,
} from "@apitoolchain/auth-design-system";
import { Callout, Logo, Link as TextLink } from "@apitoolchain/design-system";
import { Form, Link, redirect } from "react-router";
import { getMe, login } from "~/data";
import { commitToken } from "~/sessions.server";
import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Sign in — apitoolchain" }];
}

export async function loader() {
  // Already signed in → skip the form.
  if (await getMe()) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const result = await login(email, password);
  if (!result.ok) return { error: result.message };
  throw redirect("/", {
    headers: { "Set-Cookie": await commitToken(result.token) },
  });
}

export default function LoginRoute({ actionData }: Route.ComponentProps) {
  return (
    <AuthBackground>
      <AuthHeader
        title={
          <>
            Build awesome APIs <br /> on the chain{" "}
            <Logo size={42} className="inline-block align-middle" />
          </>
        }
        subtitle={
          <>
            Register{" "}
            <TextLink href="/registry" external={false} subtle sliding>
              API specs
            </TextLink>
            ,{" "}
            <TextLink href="/sdks" external={false} subtle sliding>
              SDKs
            </TextLink>
            ,{" "}
            <TextLink href="/docs" external={false} subtle sliding>
              docs
            </TextLink>
            , and{" "}
            <TextLink href="/mcp" external={false} subtle sliding>
              MCP servers
            </TextLink>{" "}
            from one source of truth.
          </>
        }
      />
      <AuthCard>
        {/* Google sign-in isn't wired yet — shown for parity, disabled. */}
        <AuthSocialButton icon={<AuthGoogleMark />} disabled>
          Continue with Google
        </AuthSocialButton>
        <AuthDivider />
        <Form method="post" className="flex flex-col gap-2.5">
          <AuthInput
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
          <AuthInput
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
          />
          {actionData?.error && (
            <Callout tone="error" icon={false}>
              {actionData.error}
            </Callout>
          )}
          <AuthButton>Continue with email</AuthButton>
        </Form>
        <AuthFormFooter>
          New here?{" "}
          <AuthLink as={Link} to="/register">
            Create an account
          </AuthLink>
        </AuthFormFooter>
      </AuthCard>
    </AuthBackground>
  );
}
