"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createThought } from "@/lib/server/thoughts";
import { thoughtSchema } from "@/lib/validations/thought";

export type ThoughtActionState = { error?: string };

export async function createThoughtAction(
  _prevState: ThoughtActionState,
  formData: FormData,
): Promise<ThoughtActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const parsed = thoughtSchema.safeParse({
    body: formData.get("body"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await createThought(session.user.id, parsed.data);

  redirect("/feed");
}
