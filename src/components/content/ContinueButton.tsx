"use client";

import { useActionState, useState } from "react";
import { GitBranch } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { continueSketchAction, type SketchActionState } from "@/actions/sketch";
import { VISIBILITY_LABELS } from "@/lib/format";

const initialState: SketchActionState = {};

export function ContinueButton({ parentId }: { parentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(continueSketchAction, initialState);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <GitBranch className="size-4" /> Continue this
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <input type="hidden" name="parentId" value={parentId} />
      <Textarea name="body" placeholder="Continue the story…" required maxLength={4000} rows={4} autoFocus />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select name="visibility" defaultValue="PUBLIC">
          <SelectTrigger className="w-36">
            <SelectValue>{(value: string) => VISIBILITY_LABELS[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="FRIENDS">Friends</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Posting…" : "Post continuation"}
          </Button>
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
