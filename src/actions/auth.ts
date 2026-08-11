"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import {
  findUserByEmailOrUsername,
  createUser,
  findUserByEmail,
  updateUserPassword,
  getSecurityQuestionForEmail,
  verifySecurityAnswer,
} from "@/lib/server/users";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/server/password-reset";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/server/email";
import { signIn, signOut } from "@/lib/auth";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  getSecurityQuestionSchema,
  resetWithSecurityAnswerSchema,
} from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import type { SecurityQuestionValue } from "@/lib/security-questions";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    securityQuestion: formData.get("securityQuestion"),
    securityAnswer: formData.get("securityAnswer"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { displayName, username, email, password, securityQuestion, securityAnswer } = parsed.data;

  const existing = await findUserByEmailOrUsername(email, username);
  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with that email already exists."
          : "That username is already taken.",
    };
  }

  await createUser({
    email,
    username,
    password,
    displayName,
    securityQuestion: securityQuestion as SecurityQuestionValue,
    securityAnswer,
  });

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

export type RequestPasswordResetState = { error?: string; sent?: boolean; devResetUrl?: string };

export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const [byEmail, byIp] = await Promise.all([
    checkRateLimit(`reset-request:${parsed.data.email}`, 3, 60 * 60 * 1000),
    checkRateLimit(`reset-request:${ip}`, 10, 60 * 60 * 1000),
  ]);
  if (!byEmail.allowed || !byIp.allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    // Same response whether the account exists or not, so this endpoint
    // can't be used to discover which emails are registered.
    return { sent: true };
  }

  const token = await createPasswordResetToken(user.id);
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(parsed.data.email, resetUrl);

  return { sent: true, devResetUrl: isEmailConfigured() ? undefined : resetUrl };
}

export async function confirmPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const consumed = await consumePasswordResetToken(parsed.data.token);
  if (!consumed) {
    return { error: "This reset link is invalid or has expired." };
  }

  await updateUserPassword(consumed.userId, parsed.data.password);
  redirect("/login");
}

export type GetSecurityQuestionState = {
  error?: string;
  checked?: boolean;
  found?: boolean;
  email?: string;
  question?: SecurityQuestionValue;
};

export async function getSecurityQuestionAction(
  _prevState: GetSecurityQuestionState,
  formData: FormData,
): Promise<GetSecurityQuestionState> {
  const parsed = getSecurityQuestionSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const { allowed } = await checkRateLimit(`security-question:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const result = await getSecurityQuestionForEmail(parsed.data.email);
  if (!result) {
    return { checked: true, found: false };
  }

  return { checked: true, found: true, email: parsed.data.email, question: result.question as SecurityQuestionValue };
}

export async function resetWithSecurityAnswerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetWithSecurityAnswerSchema.safeParse({
    email: formData.get("email"),
    securityAnswer: formData.get("securityAnswer"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { allowed } = await checkRateLimit(`security-answer:${parsed.data.email}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const verified = await verifySecurityAnswer(parsed.data.email, parsed.data.securityAnswer);
  if (!verified) {
    return { error: "That answer doesn't match." };
  }

  await updateUserPassword(verified.userId, parsed.data.password);
  redirect("/login");
}
