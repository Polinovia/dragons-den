"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { sendFriendRequest, respondToFriendRequest } from "@/lib/server/friends";
import { createNotification } from "@/lib/server/notifications";

export async function sendFriendRequestAction(username: string, path: string) {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  const friendship = await sendFriendRequest(session.user.id, username);
  if (friendship && friendship.status === "PENDING") {
    await createNotification({
      recipientId: friendship.addresseeId,
      actorId: session.user.id,
      type: "FRIEND_REQUEST",
      message: `${session.user.displayName} sent you a friend request`,
      link: `/profile/${session.user.username}`,
    });
  }

  revalidatePath(path);
  return { ok: true };
}

export async function respondToFriendRequestAction(requesterId: string, accept: boolean, path: string) {
  const session = await auth();
  if (!session?.user) return { error: "You need to be signed in." };

  await respondToFriendRequest(session.user.id, requesterId, accept);

  if (accept) {
    await createNotification({
      recipientId: requesterId,
      actorId: session.user.id,
      type: "FRIEND_ACCEPTED",
      message: `${session.user.displayName} accepted your friend request`,
      link: `/profile/${session.user.username}`,
    });
  }

  revalidatePath(path);
  return { ok: true };
}
