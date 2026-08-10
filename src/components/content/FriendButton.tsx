"use client";

import { useTransition } from "react";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendFriendRequestAction, respondToFriendRequestAction } from "@/actions/friendship";
import type { FriendshipState } from "@/lib/server/friends";

export function FriendButton({
  state,
  username,
  userId,
  path,
}: {
  state: FriendshipState;
  username: string;
  userId: string;
  path: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (state === "SELF") return null;

  if (state === "FRIENDS") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <UserCheck className="size-4" /> Friends
      </Button>
    );
  }

  if (state === "REQUEST_SENT") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Clock className="size-4" /> Request sent
      </Button>
    );
  }

  if (state === "REQUEST_RECEIVED") {
    return (
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await respondToFriendRequestAction(userId, true, path);
          })
        }
      >
        <UserCheck className="size-4" /> Accept request
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await sendFriendRequestAction(username, path);
        })
      }
    >
      <UserPlus className="size-4" /> Add friend
    </Button>
  );
}
