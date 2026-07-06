import { Logo } from "@apitoolchain/design-system";
import type { Meta, StoryObj } from "@storybook/react";
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
} from "../components";

/**
 * The login page composed from the auth building blocks — social + email
 * (passwordless). Mirrors the app's `/login` route (without the router).
 */
const meta: Meta = {
  title: "Auth/Examples/Login",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <AuthBackground>
      <AuthHeader
        title={
          <>
            Build awesome APIs <br /> on the chain{" "}
            <Logo size={42} className="inline-block align-middle" />
          </>
        }
        subtitle="Register API specs, SDKs, docs, and MCP servers from one source of truth."
      />
      <AuthCard>
        <AuthSocialButton icon={<AuthGoogleMark />} disabled>
          Continue with Google
        </AuthSocialButton>
        <AuthDivider />
        <AuthInput name="email" type="email" placeholder="Enter your email" />
        <AuthButton type="button">Continue with email</AuthButton>
        <AuthFormFooter>
          New here? <AuthLink href="#">Create an account</AuthLink>
        </AuthFormFooter>
      </AuthCard>
    </AuthBackground>
  ),
};
