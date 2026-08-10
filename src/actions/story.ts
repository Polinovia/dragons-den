"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createStory, addStoryContributor } from "@/lib/server/stories";
import { storySchema } from "@/lib/validations/story";

export type StoryActionState = { error?: string };

export async function createStoryAction(
  _prevState: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const parsed = storySchema.safeParse({
    title: formData.get("title"),
    synopsis: formData.get("synopsis"),
    visibility: formData.get("visibility"),
    allowContributions: formData.get("allowContributions"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const story = await createStory(session.user.id, parsed.data);

  redirect(`/stories/${story.slug}`);
}

export type ContributorActionState = { error?: string; success?: string };

export async function addContributorAction(
  _prevState: ContributorActionState,
  formData: FormData,
): Promise<ContributorActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const storySlug = formData.get("storySlug");
  const username = formData.get("username");
  if (typeof storySlug !== "string" || typeof username !== "string" || !username.trim()) {
    return { error: "Enter a username." };
  }

  const result = await addStoryContributor(storySlug, session.user.id, username.trim().toLowerCase());
  if ("error" in result) return { error: result.error };

  return { success: `${username} added as a contributor.` };
}
