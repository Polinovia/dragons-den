"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createThoughtAction, type ThoughtActionState } from "@/actions/thought";
import { VISIBILITY_LABELS } from "@/lib/format";

const initialState: ThoughtActionState = {};

export function NewThoughtForm() {
  const [state, formAction, isPending] = useActionState(createThoughtAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="thought-body">Thought</Label>
        <Textarea
          id="thought-body"
          name="body"
          required
          maxLength={1000}
          rows={4}
          placeholder="An idea, a question, something you noticed…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="thought-visibility">Visibility</Label>
        <Select name="visibility" defaultValue="FRIENDS">
          <SelectTrigger id="thought-visibility" className="w-full sm:w-48">
            <SelectValue>{(value: string) => VISIBILITY_LABELS[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="FRIENDS">Friends</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Posting…" : "Post thought"}
      </Button>
    </form>
  );
}
