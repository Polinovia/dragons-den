import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isEmailConfigured(): boolean {
  return resend !== null;
}

/**
 * Returns whether the email was actually sent. When RESEND_API_KEY isn't
 * configured (no Resend account set up yet), the caller is expected to
 * surface resetUrl to the requester directly as a dev-mode fallback instead.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set; skipping password reset email to ${to}. Reset URL: ${resetUrl}`);
    return { sent: false };
  }

  const { error } = await resend.emails.send({
    from: "Dragon's Den <onboarding@resend.dev>",
    to,
    subject: "Reset your Dragon's Den password",
    html: `<p>Someone requested a password reset for your Dragon's Den account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    return { sent: false };
  }

  return { sent: true };
}
