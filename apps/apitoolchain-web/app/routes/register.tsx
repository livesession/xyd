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
import { Callout } from "@apitoolchain/design-system";
import { Form, Link, redirect } from "react-router";
import { getMe, registerUser } from "~/data";
import { commitToken } from "~/sessions.server";
import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "Create account — apitoolchain" }];
}

export async function loader() {
  if (await getMe()) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim() || undefined;
  const result = await registerUser(email, password, name);
  if (!result.ok) return { error: result.message };
  throw redirect("/", {
    headers: { "Set-Cookie": await commitToken(result.token) },
  });
}

export default function RegisterRoute({ actionData }: Route.ComponentProps) {
  return (
    <AuthBackground>
      <AuthHeader
        title="Create your account"
        subtitle="Ship SDKs, docs, and MCP servers from your API specs."
      />
      <AuthCard>
        {/* Google sign-up isn't wired yet — shown for parity, disabled. */}
        <AuthSocialButton icon={<AuthGoogleMark />} disabled>
          Continue with Google
        </AuthSocialButton>
        <AuthDivider />
        <Form method="post" className="flex flex-col gap-2.5">
          <AuthInput name="name" autoComplete="name" placeholder="Your name" />
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
            autoComplete="new-password"
            placeholder="Password (8+ characters)"
          />
          {actionData?.error && (
            <Callout tone="error" icon={false}>
              {actionData.error}
            </Callout>
          )}
          <AuthButton>Create account</AuthButton>
        </Form>
        <AuthFormFooter>
          Already have an account?{" "}
          <AuthLink as={Link} to="/login">
            Sign in
          </AuthLink>
        </AuthFormFooter>
      </AuthCard>
    </AuthBackground>
  );
}
