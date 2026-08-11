"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RequestPasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          If that email has an account, we&apos;ve sent a link to reset the password. It expires in an hour.
        </p>
        {state.devResetUrl ? (
          <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Email sending isn&apos;t configured yet (no <code>RESEND_API_KEY</code>), so here&apos;s the link
            directly for local testing:{" "}
            <Link href={state.devResetUrl} className="break-all font-medium text-foreground underline underline-offset-2">
              {state.devResetUrl}
            </Link>
          </p>
        ) : null}
        <Link href="/login" className="text-sm font-medium text-foreground underline underline-offset-2">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-sm text-muted-foreground">
        <Link href="/forgot-password/security-question" className="font-medium text-foreground underline underline-offset-2">
          Answer a security question instead
        </Link>
      </p>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
