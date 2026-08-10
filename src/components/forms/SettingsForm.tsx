"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileAction, type ProfileActionState } from "@/actions/profile";

const initialState: ProfileActionState = {};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", disabled: false },
  { value: "es", label: "Español (coming soon)", disabled: true },
  { value: "fr", label: "Français (coming soon)", disabled: true },
  { value: "pt", label: "Português (coming soon)", disabled: true },
  { value: "de", label: "Deutsch (coming soon)", disabled: true },
];

export function SettingsForm({
  displayName,
  bio,
  locale,
}: {
  displayName: string;
  bio: string;
  locale: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio} maxLength={280} rows={3} placeholder="A short bio…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="locale">Interface language</Label>
        <Select name="locale" defaultValue={locale}>
          <SelectTrigger id="locale" className="w-full sm:w-64">
            <SelectValue>{(value: string) => LANGUAGE_OPTIONS.find((opt) => opt.value === value)?.label ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only English is available right now — this just saves your preference for when more languages ship.
        </p>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-primary">Saved.</p> : null}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Save changes"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Changes to your display name may take a login cycle to appear in the navigation bar.
      </p>
    </form>
  );
}
