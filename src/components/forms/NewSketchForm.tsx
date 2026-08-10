"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSketchAction, type SketchActionState } from "@/actions/sketch";
import { VISIBILITY_LABELS } from "@/lib/format";

const initialState: SketchActionState = {};

export function NewSketchForm() {
  const [state, formAction, isPending] = useActionState(createSketchAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sketch-title">Title (optional)</Label>
        <Input id="sketch-title" name="title" maxLength={140} placeholder="Untitled fragment" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sketch-body">Sketch</Label>
        <Textarea id="sketch-body" name="body" required maxLength={4000} rows={6} placeholder="An idea, a scene, a single line…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sketch-visibility">Visibility</Label>
        <Select name="visibility" defaultValue="PRIVATE">
          <SelectTrigger id="sketch-visibility" className="w-full sm:w-48">
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
        {isPending ? "Posting…" : "Post sketch"}
      </Button>
    </form>
  );
}
