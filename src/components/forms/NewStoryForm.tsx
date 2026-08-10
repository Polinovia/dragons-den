"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStoryAction, type StoryActionState } from "@/actions/story";
import { VISIBILITY_LABELS } from "@/lib/format";

const initialState: StoryActionState = {};

export function NewStoryForm() {
  const [state, formAction, isPending] = useActionState(createStoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="story-title">Title</Label>
        <Input id="story-title" name="title" required maxLength={140} placeholder="The name of your story" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="story-synopsis">Synopsis (optional)</Label>
        <Textarea id="story-synopsis" name="synopsis" maxLength={500} rows={3} placeholder="What's it about?" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="story-visibility">Visibility</Label>
        <Select name="visibility" defaultValue="PRIVATE">
          <SelectTrigger id="story-visibility" className="w-full sm:w-48">
            <SelectValue>{(value: string) => VISIBILITY_LABELS[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="FRIENDS">Friends</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id="story-contributions" name="allowContributions" />
        <Label htmlFor="story-contributions" className="font-normal">
          Allow others to contribute chapters
        </Label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Creating…" : "Start story"}
      </Button>
    </form>
  );
}
