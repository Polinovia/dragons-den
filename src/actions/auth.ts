"use server";

import { AuthError } from "next-auth";
import { findUserByEmailOrUsername, createUser } from "@/lib/server/users";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations/auth";

export type AuthActionState = { error?: string };

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
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
