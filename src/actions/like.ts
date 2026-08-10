"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { toggleLike } from "@/lib/server/likes";
import type { ContentType } from "@prisma/client";

export async function toggleLikeAction(contentType: ContentType, contentId: string, path: string) {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const result = await toggleLike(session.user.id, { contentType, id: contentId }, { id: session.user.id });
  if ("error" in result) return result;

  revalidatePath(path);
  return result;
}
