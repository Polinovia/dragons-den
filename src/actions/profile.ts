"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateProfile } from "@/lib/server/profile";
import { profileSchema } from "@/lib/validations/profile";

export type ProfileActionState = { error?: string; success?: boolean };

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await updateProfile(session.user.id, parsed.data);

  revalidatePath(`/profile/${session.user.username}`);
  revalidatePath("/settings");
  return { success: true };
}
