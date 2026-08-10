"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  checkEmailAction,
  resetPasswordAction,
  type CheckEmailState,
  type AuthActionState,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialCheckState: CheckEmailState = {};
const initialResetState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [checkState, checkFormAction, checkPending] = useActionState(checkEmailAction, initialCheckState);
  const [resetState, resetFormAction, resetPending] = useActionState(resetPasswordAction, initialResetState);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
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

  if (checkState.checked && checkState.found && checkState.email) {
    return (
      <form action={resetFormAction} onSubmit={handleResetSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={checkState.email} />

        <p className="text-sm text-muted-foreground">
          Account found for <span className="font-medium text-foreground">{checkState.email}</span>. Set a new
          password below.
        </p>

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
        ) : resetState.error ? (
          <p role="alert" className="text-sm text-destructive">
            {resetState.error}
          </p>
        ) : null}

        <Button type="submit" disabled={resetPending} className="mt-1">
          {resetPending ? "Setting password…" : "Set new password"}
        </Button>
      </form>
    );
  }

  return (
    <form action={checkFormAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {checkState.checked && !checkState.found ? (
        <p role="alert" className="text-sm text-destructive">
          No account with that email.
        </p>
      ) : checkState.error ? (
        <p role="alert" className="text-sm text-destructive">
          {checkState.error}
        </p>
      ) : null}

      <Button type="submit" disabled={checkPending} className="mt-1">
        {checkPending ? "Checking…" : "Find account"}
      </Button>

      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
