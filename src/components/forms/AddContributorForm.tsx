"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addContributorAction, type ContributorActionState } from "@/actions/story";

const initialState: ContributorActionState = {};

export function AddContributorForm({ storySlug }: { storySlug: string }) {
  const [state, formAction, isPending] = useActionState(addContributorAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <input type="hidden" name="storySlug" value={storySlug} />
      <label htmlFor="contributor-username" className="text-sm font-medium">
        Add a contributor
      </label>
      <div className="flex gap-2">
        <Input id="contributor-username" name="username" placeholder="username" className="flex-1" />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-primary">{state.success}</p> : null}
    </form>
  );
}
