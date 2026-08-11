"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  getSecurityQuestionAction,
  resetWithSecurityAnswerAction,
  type GetSecurityQuestionState,
  type AuthActionState,
} from "@/actions/auth";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialQuestionState: GetSecurityQuestionState = {};
const initialResetState: AuthActionState = {};

export function SecurityQuestionResetForm() {
  const [questionState, questionFormAction, questionPending] = useActionState(
    getSecurityQuestionAction,
    initialQuestionState,
  );
  const [resetState, resetFormAction, resetPending] = useActionState(
    resetWithSecurityAnswerAction,
    initialResetState,
  );
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

  if (questionState.checked && questionState.found && questionState.email && questionState.question) {
    return (
      <form action={resetFormAction} onSubmit={handleResetSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={questionState.email} />

        <p className="text-sm text-muted-foreground">{SECURITY_QUESTIONS[questionState.question]}</p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="securityAnswer">Answer</Label>
          <Input id="securityAnswer" name="securityAnswer" type="text" required autoComplete="off" />
        </div>

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
    <form action={questionFormAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {questionState.checked && !questionState.found ? (
        <p role="alert" className="text-sm text-destructive">
          No account with that email.
        </p>
      ) : questionState.error ? (
        <p role="alert" className="text-sm text-destructive">
          {questionState.error}
        </p>
      ) : null}

      <Button type="submit" disabled={questionPending} className="mt-1">
        {questionPending ? "Checking…" : "Continue"}
      </Button>

      <p className="text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-medium text-foreground underline underline-offset-2">
          Use an email link instead
        </Link>
      </p>
    </form>
  );
}
