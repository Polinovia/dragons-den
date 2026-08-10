"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { findUserByEmailOrUsername, createUser, findUserByEmail, updateUserPassword } from "@/lib/server/users";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

export type AuthActionState = { error?: string };

const RATE_LIMIT_MESSAGE = "Too many attempts. Try again in a few minutes.";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await clientIp();
  const { allowed } = await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { displayName, username, email, password } = parsed.data;

  const existing = await findUserByEmailOrUsername(email, username);
  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with that email already exists."
          : "That username is already taken.",
    };
  }

  await createUser({ email, username, password, displayName });

  try {
    await signIn("credentials", { email, password, redirectTo: "/feed" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { allowed } = await checkRateLimit(`login:${parsed.data.email}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/feed",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export type CheckEmailState = { error?: string; checked?: boolean; found?: boolean; email?: string };

export async function checkEmailAction(
  _prevState: CheckEmailState,
  formData: FormData,
): Promise<CheckEmailState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const { allowed } = await checkRateLimit(`reset-check:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const user = await findUserByEmail(parsed.data.email);
  return { checked: true, found: !!user, email: parsed.data.email };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { allowed } = await checkRateLimit(`reset-submit:${parsed.data.email}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return { error: "No account with that email." };
  }

  await updateUserPassword(user.id, parsed.data.password);
  redirect("/login");
}
