"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { confirmPasswordResetAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(confirmPasswordResetAction, initialState);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (password !== confirm) {
      e.preventDefault();
      setConfirmError("Passwords don't match.");
    } else {
      setConfirmError(null);
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {confirmError ? (
        <p role="alert" className="text-sm text-destructive">
          {confirmError}
        </p>
      ) : state.error ? (
        <div className="flex flex-col gap-1">
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
          <Link href="/forgot-password" className="text-sm font-medium text-foreground underline underline-offset-2">
            Request a new link
          </Link>
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending ? "Setting password…" : "Set new password"}
      </Button>
    </form>
  );
}
