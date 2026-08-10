"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addComment } from "@/lib/server/comments";
import { ContentType } from "@prisma/client";

const bodySchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(2000),
});

export type CommentActionState = { error?: string };

const CONTENT_TYPES = new Set(Object.values(ContentType));

export async function addCommentAction(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const contentType = formData.get("contentType");
  const contentId = formData.get("contentId");
  const parentId = formData.get("parentId");
  const path = formData.get("path");

  if (typeof contentType !== "string" || !CONTENT_TYPES.has(contentType as ContentType)) {
    return { error: "Missing target." };
  }
  if (typeof contentId !== "string" || !contentId) {
    return { error: "Missing target." };
  }

  const parsed = bodySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const result = await addComment(
    session.user.id,
    { contentType: contentType as ContentType, id: contentId },
    parsed.data.body,
    { id: session.user.id },
    typeof parentId === "string" && parentId ? parentId : undefined,
  );
  if ("error" in result) return { error: result.error };

  if (typeof path === "string" && path) revalidatePath(path);
  return {};
}
