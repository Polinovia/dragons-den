"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createSketch, createSketchContinuation } from "@/lib/server/sketches";
import { sketchSchema, continuationSchema } from "@/lib/validations/sketch";

export type SketchActionState = { error?: string };

export async function createSketchAction(
  _prevState: SketchActionState,
  formData: FormData,
): Promise<SketchActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const parsed = sketchSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const sketch = await createSketch(session.user.id, {
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
  });

  redirect(`/sketches/${sketch.id}`);
}

export async function continueSketchAction(
  _prevState: SketchActionState,
  formData: FormData,
): Promise<SketchActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const parentId = formData.get("parentId");
  if (typeof parentId !== "string" || !parentId) return { error: "Missing sketch." };

  const parsed = continuationSchema.safeParse({
    body: formData.get("body"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const result = await createSketchContinuation(
    parentId,
    session.user.id,
    { body: parsed.data.body, visibility: parsed.data.visibility },
    { id: session.user.id },
  );
  if ("error" in result) return { error: result.error };

  revalidatePath(`/sketches/${parentId}`);
  redirect(`/sketches/${result.id}`);
}
